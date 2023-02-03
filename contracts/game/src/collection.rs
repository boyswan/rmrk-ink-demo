use crate::rand::Rand;
use ink_prelude::{vec, vec::Vec};
use openbrush::traits::{AccountId, DefaultEnv};

#[derive(Clone, Eq, PartialEq, Debug)]
#[repr(u64)]
pub enum Item {
    Robe = 0,
    Hat = 1,
}

impl Item {
    fn to_vec() -> Vec<Self> {
        vec![Item::Robe, Item::Hat]
    }

    fn to_vec_u64() -> Vec<u64> {
        Self::to_vec().into_iter().map(|c| c as u64).collect()
    }
}

impl From<u64> for Item {
    fn from(val: u64) -> Self {
        match val {
            0 => Self::Robe,
            1 => Self::Hat,
            _ => unreachable!()
        }
    }
}

pub trait Accessor {
    fn get_collection_robe(&self) -> AccountId;
    fn get_collection_hat(&self) -> AccountId;
}

pub trait RandChoice: Rand + DefaultEnv + Accessor {
    fn get(&self) -> AccountId {
        let choices = Item::to_vec_u64();
        let result = Rand::pseudo_choice(self, choices);
        match result.into() {
            Item::Robe => self.get_collection_robe(),
            Item::Hat => self.get_collection_hat(),
        }
    }
}
