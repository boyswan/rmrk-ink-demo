#![cfg_attr(not(feature = "std"), no_std)]
#![feature(core_panic)]
mod collection;
mod rand;

#[openbrush::contract]
pub mod game {
    use crate::{collection, rand};
    use ink_prelude::vec::Vec;
    use ink_storage::traits::SpreadAllocate;
    use ink_storage::Mapping;
    use openbrush::{
        contracts::psp34::{Id, PSP34Ref},
        traits::Storage,
    };
    use rmrk::traits::{EquippableRef, MintingRef, NestingRef};

    #[ink(storage)]
    #[derive(Default, SpreadAllocate, Storage)]
    pub struct Game {
        collection_body: AccountId,
        collection_robe: AccountId,
        collection_hat: AccountId,
        owners: Mapping<AccountId, Id>,
    }

    impl rand::Rand for Game {}
    impl collection::RandChoice for Game {}
    impl collection::Accessor for Game {
        fn get_collection_robe(&self) -> AccountId {
            self.collection_robe
        }
        fn get_collection_hat(&self) -> AccountId {
            self.collection_hat
        }
    }

    impl Game {
        #[ink(constructor)]
        pub fn new(
            collection_body: AccountId,
            collection_robe: AccountId,
            collection_hat: AccountId,
        ) -> Self {
            ink_lang::codegen::initialize_contract(|instance: &mut Game| {
                instance.collection_body = collection_body;
                instance.collection_robe = collection_robe;
                instance.collection_hat = collection_hat;
            })
        }

        #[ink(message)]
        pub fn mint_character(&mut self) {
            let caller = self.env().caller();
            let contract = Self::env().account_id();
            let child_addr = collection::RandChoice::get(self);
            let parent_id = MintingRef::mint_next_to(&self.collection_body, contract).unwrap();
            let child_id = MintingRef::mint_next_to(&child_addr, contract).unwrap();
            let child = (child_addr, child_id);
            PSP34Ref::approve(&child.0, self.collection_body, Some(child.1.clone()), true).unwrap();
            NestingRef::add_child(&self.collection_body, parent_id.clone(), child.clone()).unwrap();
            EquippableRef::equip(&self.collection_body, parent_id.clone(), 1, 1, child, 2).unwrap();
            PSP34Ref::transfer(&self.collection_body, caller, parent_id, Vec::new()).unwrap();
        }
    }
}
