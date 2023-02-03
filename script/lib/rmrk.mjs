import * as util from './util.mjs'


export function extractTxResult(
  events,
  expectSection,
  expectMethod,
  extractAction
) {
  let success = false;
  let successData = null;
  events.forEach(({ event: { data, method, section } }) => {
    if (method == 'ExtrinsicSuccess') {
      success = true;
    } else if ((expectSection == section) && (expectMethod == method)) {
      successData = extractAction(data);
    }
  });
  const result = {
    success,
    successData,
  };
  return result;
}

export function extractRmrkTxResult(
  events,
  expectMethod,
  extractAction,
  type = 'rmrkCore'
) {
  return extractTxResult(events, type, expectMethod, extractAction);
}


export let create_collection = async (metadata, limit, symbol) => {
  let { api } = await util.setup_api();
  const events = await util.sign(api.tx.rmrkCore.createCollection, metadata, limit, symbol);
  const collectionResult = extractRmrkCoreTxResult(
    events,
    "CollectionCreated",
    (data) => parseInt(data[1].toString(), 10)
  );
  return collectionResult.successData;
}

export let send = async (signer, collection_id, nft_id, parent) => {
  let { api } = await util.setup_api();
  console.log(api.tx.rmrkCore.send.meta.args.map(x => x.toHuman()))
  // console.log(api)
  let owner = api.createType("RmrkTraitsNftAccountIdOrCollectionNftTuple", {
    "CollectionAndNftTuple": parent
  });
  return await util._sign(signer, api.tx.rmrkCore.send,
    collection_id, nft_id, owner
  );
}

export let equip = async (signer, item, equipper, res_id, base, slot) => {
  let { api } = await util.setup_api();
  console.log(api.tx.rmrkEquip.equip.meta.args.map(x => x.toHuman()))
  return await util._sign(signer, api.tx.rmrkEquip.equip,
    item, equipper, res_id, base, slot
  );
}


export let set_property = async (cid, nid, key, value) => {
  let { api, signer } = await util.setup_api();
  return await util._sign(signer, api.tx.rmrkCore.setProperty,
    cid,
    api.createType("Option<u32>", nid),
    key,
    value
  );
}

export let set_accept_ownership = async (signer, id) => {
  let { api } = await util.setup_api();
  return await util._sign(signer, api.tx.uniques.setAcceptOwnership,
    api.createType("Option<u32>", id)
  );
}

export let change_issuer = async (to, id) => {
  let { api } = await util.setup_api();

  const events = await util.sign(
    api.tx.rmrkCore.changeCollectionIssuer,
    id,
    to,
  );
  const result = extractRmrkCoreTxResult(
    events,
    "IssuerChanged",
    (data) => data
  );
  return result
}

export let mint_nft = async (collection_id) => {
  let { api, signer } = await util.setup_api();
  const events = await util.sign(
    api.tx.rmrkCore.mintNft,
    signer.address,
    collection_id,
    null,
    null,
    "metadata-asfadfa-",
    true,
    null
  );
  const result = extractRmrkCoreTxResult(
    events,
    "NftMinted",
    (data) => data
  );
  console.log(result)

}

export let create_base = async (baseType, symbol, parts) => {
  let { api } = await util.setup_api();
  const partTypes = api.createType(
    "Vec<RmrkTraitsPartPartType>",
    parts
  );


  const events = await util.sign(api.tx.rmrkEquip.createBase, baseType, symbol, partTypes);
  const baseResult = extractRmrkTxResult(events, "BaseCreated", (data) => {
    return parseInt(data[1].toString(), 10);
  }, 'rmrkEquip');

  return baseResult
}
