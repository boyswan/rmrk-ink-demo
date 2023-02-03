#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod body {
    use ink_lang::codegen::{EmitEvent, Env};
    use ink_prelude::vec;
    use ink_storage::traits::SpreadAllocate;
    use openbrush::{
        contracts::{
            ownable::*,
            psp34::extensions::{enumerable::*, metadata::*},
            reentrancy_guard::*,
        },
        traits::{Storage, String},
    };

    use rmrk::{
        config,
        storage::{MultiAssetData, *},
        traits::*,
        types::*,
    };

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
        base: BaseData,
        #[storage_field]
        minting: MintingData,
        #[storage_field]
        nesting: NestingData,
        #[storage_field]
        equippable: EquippableData,
        #[storage_field]
        multiasset: MultiAssetData,
    }

    impl PSP34 for Rmrk {}

    impl Ownable for Rmrk {}

    impl PSP34Metadata for Rmrk {}

    impl PSP34Enumerable for Rmrk {}

    impl Minting for Rmrk {}

    impl Base for Rmrk {}

    impl MultiAsset for Rmrk {}

    impl Nesting for Rmrk {}

    impl Equippable for Rmrk {}

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
            collection_item_robe: AccountId,
            collection_item_hat: AccountId,
        ) -> Self {
            ink_lang::codegen::initialize_contract(|instance: &mut Rmrk| {
                config::with_owner(instance, Self::env().caller());
                config::with_minting(instance, max_supply, price_per_mint);
                config::with_metadata(instance, name, symbol, base_uri, collection_metadata);

                let parts = vec![
                    Part {
                        part_type: PartType::Slot,
                        z: 1,
                        equippable: vec![collection_item_robe],
                        metadata_uri: String::from("ipfs://mock/robe.svg"),
                        is_equippable_by_all: false,
                    },
                    Part {
                        part_type: PartType::Slot,
                        z: 2,
                        equippable: vec![collection_item_hat],
                        metadata_uri: String::from("ipfs://mock/hat.svg"),
                        is_equippable_by_all: false,
                    },
                ];

                config::with_parts(instance, parts).expect("Invalid parts");
                instance
                    .add_asset_entry(0, 0, String::from(""), vec![0])
                    .unwrap();
                instance
                    .add_asset_entry(1, 1, String::from(""), vec![1])
                    .unwrap();
            })
        }
    }
}
