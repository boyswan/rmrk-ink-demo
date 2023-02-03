import * as lib from "./lib/index.mjs";

export let run = async () => {
  let make_item = async () =>
    await lib.deploy("item", null, "", "", "", 1000, 0, "ipfs");

  let make_body = async (robe_address, hat_address) =>
    await lib.deploy(
      "body",
      null,
      "",
      "",
      "",
      1000,
      0,
      "ipfs",
      robe_address,
      hat_address
    );

  let contract_robe = await make_item();
  let contract_hat = await make_item();
  let contract_body = await make_body(
    contract_robe.address,
    contract_hat.address
  );

  let game = await lib.deploy(
    "game",
    null,
    contract_body.address,
    contract_robe.address,
    contract_hat.address
  );

  console.log("Game Contract deployed at ", game.address);

  let res = await lib.tx(game, "mintCharacter");

  res = await lib.query(contract_body, "nesting::childrenBalance", { u64: 1 });
  console.log("Child balance", res.output.toHuman());

  res = await lib.query(contract_body, "psp34::ownerOf", { u64: 1 });
  console.log("Owner of", res.output.toHuman());
};

run();
