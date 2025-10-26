#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String, Vec,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    RecoveryEmail,
    Balance,
    IsInitialized,
    AllowedRecipient,
    AllowedAssets,
    Guardians,
}

#[contract]
pub struct GhostWallet;

#[contractimpl]
impl GhostWallet {
    // --- Internal helpers ---

    fn assert_initialized(env: &Env) {
        if !env.storage().instance().has(&DataKey::IsInitialized) {
            panic!("Wallet not initialized");
        }
    }

    fn load_allowed_assets(env: &Env) -> Vec<String> {
        if let Some(assets) = env.storage().instance().get(&DataKey::AllowedAssets) {
            assets
        } else {
            Vec::new(env)
        }
    }

    fn load_guardians(env: &Env) -> Vec<Address> {
        if let Some(guardians) = env.storage().instance().get(&DataKey::Guardians) {
            guardians
        } else {
            Vec::new(env)
        }
    }

    fn is_asset_allowed(env: &Env, asset_code: &String) -> bool {
        let allowed_assets = Self::load_allowed_assets(env);
        allowed_assets.iter().any(|stored| stored == *asset_code)
    }

fn verify_email_claim(env: &Env, provided_claim: &String) -> bool {
    if provided_claim.is_empty() {
        return false;
    }

    match env
        .storage()
        .instance()
        .get::<DataKey, String>(&DataKey::RecoveryEmail)
    {
        Some(stored) => stored == *provided_claim,
        None => false,
    }
}


    fn require_guardian_approval(env: &Env, approvals: Vec<Address>) -> bool {
        if approvals.len() == 0 {
            return false;
        }

        let guardians = Self::load_guardians(env);

        if guardians.len() == 0 {
            panic!("No guardians registered for approval flow");
        }

        for provided in approvals.iter() {
            for guardian in guardians.iter() {
                if guardian == provided {
                    provided.require_auth();
                    return true;
                }
            }
        }

        panic!("Guardian approval required");
    }

    // --- Public contract methods ---

    /// Initialize a new ghost wallet with owner and recovery email
    pub fn initialize(env: Env, owner: Address, recovery_email: String) {
        if env.storage().instance().has(&DataKey::IsInitialized) {
            panic!("Wallet already initialized");
        }

        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::RecoveryEmail, &recovery_email);
        env.storage().instance().set(&DataKey::IsInitialized, &true);

        let mut allowed_assets = Vec::new(&env);
        allowed_assets.push_back(String::from_str(&env, "XLM"));
        allowed_assets.push_back(String::from_str(&env, "USDC"));
        allowed_assets.push_back(String::from_str(&env, "PYUSD"));
        env.storage().instance().set(&DataKey::AllowedAssets, &allowed_assets);

        let guardians = Vec::<Address>::new(&env);
        env.storage().instance().set(&DataKey::Guardians, &guardians);
    }

    pub fn get_owner(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Owner)
            .unwrap_or_else(|| panic!("Wallet not initialized"))
    }

    pub fn get_recovery_email(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::RecoveryEmail)
            .unwrap_or_else(|| panic!("Wallet not initialized"))
    }

    pub fn transfer_ownership(env: Env, new_owner: Address) {
        let current_owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .unwrap_or_else(|| panic!("Wallet not initialized"));

        current_owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &new_owner);
    }

    pub fn get_allowed_assets(env: Env) -> Vec<String> {
        Self::assert_initialized(&env);
        Self::load_allowed_assets(&env)
    }

    pub fn update_allowed_asset(env: Env, asset_code: String, allow: bool) {
        Self::assert_initialized(&env);

        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .unwrap_or_else(|| panic!("Wallet not initialized"));
        owner.require_auth();

        let mut allowed_assets = Self::load_allowed_assets(&env);

        if allow {
            if !allowed_assets.iter().any(|existing| existing == asset_code) {
                allowed_assets.push_back(asset_code);
            }
        } else {
            let mut retained = Vec::new(&env);
            for existing in allowed_assets.iter() {
                if existing != asset_code {
                    retained.push_back(existing.clone());
                }
            }
            allowed_assets = retained;
        }

        env.storage().instance().set(&DataKey::AllowedAssets, &allowed_assets);
    }

    pub fn update_guardian(env: Env, guardian: Address, allow: bool) {
        Self::assert_initialized(&env);

        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .unwrap_or_else(|| panic!("Wallet not initialized"));
        owner.require_auth();

        let mut guardians = Self::load_guardians(&env);

        if allow {
            if !guardians.iter().any(|existing| existing == guardian) {
                guardians.push_back(guardian);
            }
        } else {
            let mut retained = Vec::new(&env);
            for existing in guardians.iter() {
                if existing != guardian {
                    retained.push_back(existing.clone());
                }
            }
            guardians = retained;
        }

        env.storage().instance().set(&DataKey::Guardians, &guardians);
    }

    pub fn withdraw(
        env: Env,
        token_address: Address,
        asset_code: String,
        amount: i128,
        to: Address,
    ) {
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .unwrap_or_else(|| panic!("Wallet not initialized"));
        owner.require_auth();

        if !Self::is_asset_allowed(&env, &asset_code) {
            panic!("Asset not allowed");
        }

        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &to, &amount);
    }

    pub fn get_balance(env: Env, token_address: Address) -> i128 {
        let token_client = token::Client::new(&env, &token_address);
        token_client.balance(&env.current_contract_address())
    }

    pub fn social_recover(env: Env, new_owner: Address, email_claim: String, approvals: Vec<Address>) {
        Self::assert_initialized(&env);

        let mut authorized = false;

        if Self::verify_email_claim(&env, &email_claim) {
            authorized = true;
        } else if Self::require_guardian_approval(&env, approvals) {
            authorized = true;
        }

        if !authorized {
            panic!("Recovery requires email claim or guardian approval");
        }

        env.storage().instance().set(&DataKey::Owner, &new_owner);
    }

    pub fn forward_balance(
        env: Env,
        token_address: Address,
        asset_code: String,
        destination_wallet: Address,
        email_claim: String,
    ) {
        Self::assert_initialized(&env);

        if !Self::is_asset_allowed(&env, &asset_code) {
            panic!("Asset not allowed");
        }

        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .unwrap_or_else(|| panic!("Wallet not initialized"));

        let mut authorized = false;

        if Self::verify_email_claim(&env, &email_claim) {
            authorized = true;
        } else {
            owner.require_auth();
            authorized = true;
        }

        if !authorized {
            panic!("Forwarding requires a valid email claim or owner authorization");
        }

        let token_client = token::Client::new(&env, &token_address);
        let balance = token_client.balance(&env.current_contract_address());

        if balance <= 0 {
            panic!("No balance available to forward");
        }

        token_client.transfer(&env.current_contract_address(), &destination_wallet, &balance);
        env.storage().instance().set(&DataKey::AllowedRecipient, &destination_wallet);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String, Vec};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, GhostWallet);
        let client = GhostWalletClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let recovery_email = String::from_str(&env, "user@example.com");

        client.initialize(&owner, &recovery_email);

        assert_eq!(client.get_owner(), owner);
        assert_eq!(client.get_recovery_email(), recovery_email);
        let allowed = client.get_allowed_assets();
        assert!(allowed.iter().any(|code| code == &String::from_str(&env, "XLM")));
    }

    #[test]
    fn test_transfer_ownership() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, GhostWallet);
        let client = GhostWalletClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let new_owner = Address::generate(&env);
        let recovery_email = String::from_str(&env, "user@example.com");

        client.initialize(&owner, &recovery_email);
        client.transfer_ownership(&new_owner);

        assert_eq!(client.get_owner(), new_owner);
    }

    #[test]
    fn test_social_recover_with_email() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, GhostWallet);
        let client = GhostWalletClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let new_owner = Address::generate(&env);
        let recovery_email = String::from_str(&env, "user@example.com");

        client.initialize(&owner, &recovery_email);
        client.social_recover(&new_owner, recovery_email.clone(), Vec::new(&env));

        assert_eq!(client.get_owner(), new_owner);
    }

    #[test]
    fn test_social_recover_with_guardian() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, GhostWallet);
        let client = GhostWalletClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let new_owner = Address::generate(&env);
        let guardian = Address::generate(&env);
        let recovery_email = String::from_str(&env, "user@example.com");

        client.initialize(&owner, &recovery_email);
        client.update_guardian(&guardian, &true);

        let mut approvals = Vec::new(&env);
        approvals.push_back(guardian.clone());

        client.social_recover(&new_owner, String::from_str(&env, ""), approvals);

        assert_eq!(client.get_owner(), new_owner);
    }
}
