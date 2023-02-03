#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod item {
    use ink_lang::codegen::{EmitEvent, Env};

    use ink_storage::traits::SpreadAllocate;
    use openbrush::{
        contracts::{
            ownable::*,
            psp34::extensions::{enumerable::*, metadata::*},
            reentrancy_guard::*,
        },
        traits::{Storage, String},
    };

    use rmrk::{config, storage::*, traits::*};

    // Rmrk contract storage
    #[ink(storage)]
    #[derive(Default, SpreadAllocate, Storage)]
    pub struct Rmrk {
        #[storage_field]
        psp34: psp34::Data<enumerable::Balances>,
        #[storage_field]
        guard: reentrancy_guard::Data,
        #[storage_field]
        ownable: ownable::Data,
        #[storage_field]
        metadata: metadata::Data,
        #[storage_field]
        minting: MintingData,
    }

    impl PSP34 for Rmrk {}

    impl Ownable for Rmrk {}

    impl PSP34Metadata for Rmrk {}

    impl PSP34Enumerable for Rmrk {}

    impl Minting for Rmrk {}

    impl Rmrk {
        /// Instantiate new RMRK contract
        #[ink(constructor)]
        pub fn new(
            name: String,
            symbol: String,
            base_uri: String,
            max_supply: u64,
            price_per_mint: Balance,
            collection_metadata: String,
        ) -> Self {
            ink_lang::codegen::initialize_contract(|instance: &mut Rmrk| {
                config::with_owner(instance, Self::env().caller());
                config::with_minting(instance, max_supply, price_per_mint);
                config::with_metadata(instance, name, symbol, base_uri, collection_metadata);
            })
        }
    }
}
