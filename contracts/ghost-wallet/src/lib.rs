#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec, token};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    RecoveryEmail,
    Balance,
    IsInitialized,
    AllowedRecipient,
}

#[contract]
pub struct GhostWallet;

#[contractimpl]
impl GhostWallet {
    /// Initialize a new ghost wallet with owner and recovery email
    pub fn initialize(env: Env, owner: Address, recovery_email: String) {
        // Ensure wallet hasn't been initialized yet
        if env.storage().instance().has(&DataKey::IsInitialized) {
            panic!("Wallet already initialized");
        }

        // Store owner and recovery email
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::RecoveryEmail, &recovery_email);
        env.storage().instance().set(&DataKey::IsInitialized, &true);
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
        let current_owner: Address = env.storage()
            .instance()
            .get(&DataKey::Owner)
            .unwrap_or_else(|| panic!("Wallet not initialized"));

        // Verify the caller is the current owner
        current_owner.require_auth();

        // Update owner
        env.storage().instance().set(&DataKey::Owner, &new_owner);
    }

    /// Withdraw tokens from the wallet (requires owner authorization)
    pub fn withdraw(env: Env, token_address: Address, amount: i128, to: Address) {
        let owner: Address = env.storage()
            .instance()
            .get(&DataKey::Owner)
            .unwrap_or_else(|| panic!("Wallet not initialized"));

        // Verify the caller is the owner
        owner.require_auth();

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
    /// This would be called by the backend after email verification
    pub fn recover_ownership(env: Env, new_owner: Address, recovery_signature: String) {
        // In production, verify the recovery_signature is valid
        // For now, we'll implement basic recovery logic
        
        let _recovery_email: String = env.storage()
            .instance()
            .get(&DataKey::RecoveryEmail)
            .unwrap_or_else(|| panic!("Wallet not initialized"));

        // Update owner to new address
        env.storage().instance().set(&DataKey::Owner, &new_owner);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

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
}
