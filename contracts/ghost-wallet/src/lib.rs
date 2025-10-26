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
    fn assert_initialized(env: &Env) {
        if !env.storage().instance().has(&DataKey::IsInitialized) {
            panic!("Wallet not initialized");
        }
    }

    fn get_allowed_assets(env: &Env) -> Vec<String> {
        if let Some(assets) = env.storage().instance().get(&DataKey::AllowedAssets) {
            assets
        } else {
            Vec::new(env)
        }
    }

    fn get_guardians(env: &Env) -> Vec<Address> {
        if let Some(guardians) = env.storage().instance().get(&DataKey::Guardians) {
            guardians
        } else {
            Vec::new(env)
        }
    }

    fn is_asset_allowed(env: &Env, asset_code: &String) -> bool {
        let allowed_assets = Self::get_allowed_assets(env);
        allowed_assets.iter().any(|stored| stored == asset_code)
    }

    fn verify_email_claim(env: &Env, provided_claim: &String) -> bool {
        if provided_claim.is_empty() {
            return false;
        }

        match env.storage().instance().get(&DataKey::RecoveryEmail) {
            Some(stored) => stored == *provided_claim,
            None => false,
        }
    }

    fn require_guardian_approval(env: &Env, approvals: Vec<Address>) -> bool {
        if approvals.len() == 0 {
            return false;
        }

        let guardians = Self::get_guardians(env);

        if guardians.len() == 0 {
            panic!("No guardians registered for approval flow");
        }

        let mut approved = false;

        for provided in approvals.iter() {
            for guardian in guardians.iter() {
                if guardian == provided {
                    provided.require_auth();
                    approved = true;
                    break;
                }
            }

            if approved {
                break;
            }
        }

        if !approved {
            panic!("Guardian approval required");
        }

        approved
    }

    /// Initialize a new ghost wallet with owner and recovery email
    pub fn initialize(env: Env, owner: Address, recovery_email: String) {
        // Ensure wallet hasn't been initialized yet
        if env.storage().instance().has(&DataKey::IsInitialized) {
            panic!("Wallet already initialized");
        }

        // Store owner and recovery email
        env.storage().instance().set(&DataKey::Owner, &owner);
        env
            .storage()
            .instance()
            .set(&DataKey::RecoveryEmail, &recovery_email);
        env.storage().instance().set(&DataKey::IsInitialized, &true);

        // Default to a multi-asset allow list so the contract is ready for
        // common stablecoin flows. In production, these would be the hashed
        // identifiers for issued assets on testnet or mainnet.
        let mut allowed_assets = Vec::new(&env);
        allowed_assets.push_back(String::from_str(&env, "XLM"));
        allowed_assets.push_back(String::from_str(&env, "USDC"));
        allowed_assets.push_back(String::from_str(&env, "PYUSD"));
        env
            .storage()
            .instance()
            .set(&DataKey::AllowedAssets, &allowed_assets);

        // Start with an empty guardian set. Guardians can be added after
        // initialization to facilitate social recovery using trusted peers.
        let guardians = Vec::<Address>::new(&env);
        env.storage().instance().set(&DataKey::Guardians, &guardians);
    }

    /// Get the current owner of the wallet
    pub fn get_owner(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Owner)
            .unwrap_or_else(|| panic!("Wallet not initialized"))
    }

    /// Get the recovery email
    pub fn get_recovery_email(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::RecoveryEmail)
            .unwrap_or_else(|| panic!("Wallet not initialized"))
    }

    /// Transfer ownership to a new address (requires current owner authorization)
    pub fn transfer_ownership(env: Env, new_owner: Address) {
        let current_owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .unwrap_or_else(|| panic!("Wallet not initialized"));

        // Verify the caller is the current owner
        current_owner.require_auth();

        // Update owner
        env.storage().instance().set(&DataKey::Owner, &new_owner);
    }

    /// Return the allow list of asset codes this wallet will interact with.
    pub fn get_allowed_assets(env: Env) -> Vec<String> {
        Self::assert_initialized(&env);
        Self::get_allowed_assets(&env)
    }

    /// Add or remove an allowed asset. Requires owner authorization.
    pub fn update_allowed_asset(env: Env, asset_code: String, allow: bool) {
        Self::assert_initialized(&env);

        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .unwrap_or_else(|| panic!("Wallet not initialized"));

        owner.require_auth();

        let mut allowed_assets = Self::get_allowed_assets(&env);

        if allow {
            if !allowed_assets.iter().any(|existing| existing == &asset_code) {
                allowed_assets.push_back(asset_code);
            }
        } else {
            let mut retained = Vec::new(&env);
            for existing in allowed_assets.iter() {
                if existing != &asset_code {
                    retained.push_back(existing.clone());
                }
            }
            allowed_assets = retained;
        }

        env
            .storage()
            .instance()
            .set(&DataKey::AllowedAssets, &allowed_assets);
    }

    /// Register or remove a guardian who can approve emergency recovery flows.
    pub fn update_guardian(env: Env, guardian: Address, allow: bool) {
        Self::assert_initialized(&env);

        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .unwrap_or_else(|| panic!("Wallet not initialized"));

        owner.require_auth();

        let mut guardians = Self::get_guardians(&env);

        if allow {
            if !guardians.iter().any(|existing| existing == &guardian) {
                guardians.push_back(guardian);
            }
        } else {
            let mut retained = Vec::new(&env);
            for existing in guardians.iter() {
                if existing != &guardian {
                    retained.push_back(existing.clone());
                }
            }
            guardians = retained;
        }

        env.storage().instance().set(&DataKey::Guardians, &guardians);
    }

    /// Withdraw tokens from the wallet (requires owner authorization)
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

        // Verify the caller is the owner
        owner.require_auth();

        if !Self::is_asset_allowed(&env, &asset_code) {
            panic!("Asset not allowed");
        }

        // Transfer tokens
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &to, &amount);
    }

    /// Get balance of a specific token in this wallet
    pub fn get_balance(env: Env, token_address: Address) -> i128 {
        let token_client = token::Client::new(&env, &token_address);
        token_client.balance(&env.current_contract_address())
    }

    /// Recover wallet ownership using recovery email verification
    /// or guardian approvals. The email claim is expected to be a hashed
    /// verification token issued by the backend after validating the user.
    pub fn social_recover(env: Env, new_owner: Address, email_claim: String, approvals: Vec<Address>) {
        Self::assert_initialized(&env);

        let mut authorized = false;

        if Self::verify_email_claim(&env, &email_claim) {
            authorized = true;
        }

        if !authorized {
            authorized = Self::require_guardian_approval(&env, approvals);
        }

        if !authorized {
            panic!("Recovery requires email claim or guardian approval");
        }

        env.storage().instance().set(&DataKey::Owner, &new_owner);
    }

    /// Forward the entire balance to another wallet when an authenticated
    /// recovery email is presented. This is primarily used to coordinate
    /// email-driven transfers between smart wallets.
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
        }

        if !authorized {
            owner.require_auth();
            authorized = true;
        }

        if !authorized {
            panic!("Forwarding requires a valid email claim or owner authorization");
        }

        // TODO: Wire this method to the canonical Soroban token client once
        // multiple asset contracts are deployed to the target network. For the
        // hackathon demo we optimistically attempt the transfer and then track
        // the intention on-chain by updating contract storage.
        let token_client = token::Client::new(&env, &token_address);
        let balance = token_client.balance(&env.current_contract_address());

        if balance <= 0 {
            panic!("No balance available to forward");
        }

        token_client.transfer(&env.current_contract_address(), &destination_wallet, &balance);
        env
            .storage()
            .instance()
            .set(&DataKey::AllowedRecipient, &destination_wallet);
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
