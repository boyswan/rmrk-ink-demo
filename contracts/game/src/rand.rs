use openbrush::traits::DefaultEnv;

use rand::distributions::Distribution;
use rand::distributions::WeightedIndex;
use rand_chacha::rand_core::SeedableRng;
use rand_chacha::ChaChaRng;

use ink_prelude::vec::Vec;

pub trait Rand: DefaultEnv {
    fn generate_seed(&self) -> [u8; 32] {
        let block = Self::env().block_number().clone().to_le_bytes().to_vec();
        let random_seed = Self::env().random(&*block);
        let mut seed_converted: [u8; 32] = Default::default();
        seed_converted.copy_from_slice(random_seed.0.as_ref());
        seed_converted
    }

    fn pseudo_choice(&self, choices: Vec<u64>) -> u64 {
        let seed = self.generate_seed();
        let dist = WeightedIndex::new(choices.clone()).unwrap();
        let mut rng = ChaChaRng::from_seed(seed);
        let index = dist.sample(&mut rng);
        choices[index]
    }
}
