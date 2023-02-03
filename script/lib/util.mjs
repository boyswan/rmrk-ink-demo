import { Abi, ContractPromise, CodePromise } from "@polkadot/api-contract";
import { u8aToHex, compactStripLength } from "@polkadot/util";
import { ApiPromise } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { decodeAddress, cryptoWaitReady } from "@polkadot/util-crypto";
import fs from "fs";
import path from "path";
import BN from "bn.js";
import { fileURLToPath } from "url";
import { createRequire } from "module";

export { default as axios } from "axios";

let require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gasLimit = 30000n * 1000000n;
const storageDepositLimit = null;
const getGasLimit = (api) =>
  api.registry.createType("WeightV2", {
    refTime: new BN("100000000000"),
    proofSize: new BN("100000000000"),
  });

export let writeFile = (name, data) => {
  let p = path.join(__dirname, "../../", `/tmp/${name}`);
  return fs.writeFileSync(p, data, console.log);
};

export let readFile = (name) => {
  let p = path.join(__dirname, "../../", `/tmp/${name}`);
  try {
    return JSON.parse(fs.readFileSync(p, console.log));
  } catch (e) {
    console.error(e);
    return {};
  }
};

export let signer = async (uri = "//Alice") => {
  await cryptoWaitReady();
  let keyring = new Keyring({ type: "sr25519" });
  return keyring.addFromUri(uri);
};

export let setup_api = async () => {
  let signer_ = await signer();
  let api = await ApiPromise.create({
    signer: signer_,
  });
  await api.isReady;
  return { api, signer: signer_ };
};

export let artifacts = async (name) => {
  let { api } = await setup_api();
  let ink_path = path.join(__dirname, "../../", `/target/ink/${name}`);
  let metadata = require(`${ink_path}/metadata.json`);
  let wasm = fs.readFileSync(`${ink_path}/${name}.wasm`);
  let abi = new Abi(metadata, api.registry.getChainProperties());
  let code = new CodePromise(api, abi, wasm);
  return { abi, metadata, wasm, code };
};

export let contract = async (address, name) => {
  let { api } = await setup_api();
  let { abi } = await artifacts(name);
  return new ContractPromise(api, abi, address);
};

export let proxy = async (proxy, name) => {
  await contract(proxy.address, name);
};

export let _deploy = async (signer, name, salt, ...args) => {
  let { code } = await artifacts(name);
  let opts = salt === undefined ? { gasLimit, salt: name } : { gasLimit };
  return await new Promise(async (res, rej) => {
    await code.tx.new(opts, ...(args || [])).signAndSend(signer, (result) => {
      if (result.contract) res(result.contract);

      if (result.dispatchError) {
        console.log(result.toString());
        rej(new Error("Unable to deploy contract"));
      }
    });
  });
};

export let deploy = async (name, salt, ...args) => {
  let { signer } = await setup_api();
  return await _deploy(signer, name, salt, ...args);
};

export let _sign = async (signer, method, ...args) => {
  return await new Promise(async (res, _rej) => {
    await method(...args).signAndSend(signer, (result) => {
      if (result.isInBlock) res(result.events);
    });
  });
};

export let sign = async (method, ...args) => {
  let { signer } = await setup_api();
  return await _sign(signer, method, ...args);
};

export let transfer = async (to) => {
  let { api, signer } = await setup_api();
  let amt = "100000000000000000000";
  return await new Promise(async (res, _rej) => {
    await api.tx.balances
      .transferKeepAlive(to, amt)
      .signAndSend(signer, (result) => {
        if (result.isInBlock) res(result.events);
      });
  });
};

export let _tx = async (signer, contract, method, ...args) => {
  return await new Promise(async (res, _rej) => {
    let { api } = await setup_api();
    let { gasRequired, result } = await contract.query[method](
      signer.address,
      {
        storageDepositLimit: null,
        gasLimit: getGasLimit(api),
      },
      ...args
    );
    // let gasLimitBuffer = result.isOk ? gasRequired * 2n : getGasLimit(api);
    let gasLimitBuffer = getGasLimit(api);
    await contract.tx[method](
      { gasLimit: gasLimitBuffer, value: 0 },
      ...args
    ).signAndSend(signer, (result) => {
      // console.log(result)
      if (result.isInBlock) res(result.events);
      if (result.status.toHuman().Finalized)
        res(result.events.map((x) => x.toHuman()));
    });
  });
};

export let tx = async (contract, method, ...args) => {
  let { signer } = await setup_api();
  return await _tx(signer, contract, method, ...args);
};

export let diamond_cut = async (name, init_method) => {
  let { api } = await setup_api();
  // let path = `../contracts/${name}/target/ink`;
  let path = `../target/ink/${name}`;
  let metadata = require(`${path}/metadata.json`);
  let abi = new Abi(metadata, api.registry.getChainProperties());
  let hash = abi.json.source.hash;
  let init = abi.messages.find((x) => x.method == init_method);
  let selectors = abi.messages.map((x) => x.selector);
  let cut = [[hash, selectors]];
  return { cut, hash, selectors, init };
};

export let diamond_cut_contract = (
  contract,
  init_method,
  ignore_selectors = []
) => {
  let hash = contract.abi.json.source.hash;
  let init = contract.abi.messages.find((x) => x.method == init_method);
  let messages = contract.abi.messages.filter(
    (message) => !ignore_selectors.some((s) => message.identifier.includes(s))
  );
  let selectors = messages.map((x) => x.selector);
  let cut = [[hash, selectors]];
  return { cut, hash, selectors, init };
};

export let encode = (contract, method, value) => {
  let fn = contract.abi.messages.find((x) => x.method == method);
  let dataWithSelector = fn.toU8a([value]);
  let data = new Uint8Array(dataWithSelector.length - 4);
  let dataLength = dataWithSelector[0];
  dataLength -= 4 * 4;
  data.set([dataLength]);
  data.set(dataWithSelector.slice(5), 1);
  // Should this be here?
  data[1] = data[1] - 4;
  return data;
};

export let decode = async (type, res) => {
  let { api } = await setup_api();
  return api.createType(type, compactStripLength(res.output.toU8a())[1]);
};

export let tx_diamond_cut = async (contract, facet, input = []) => {
  let args = [facet.hash, facet.init.selector, input];
  await tx(contract, "diamond::diamondCut", undefined, facet.cut, args);
};

export let _query = async (signer, contract, method, ...args) => {
  let { api } = await setup_api();
  return await contract.query[method](
    signer.address,
    { gasLimit: getGasLimit(api) },
    ...args
  );
};

export let query = async (contract, method, ...args) => {
  let { signer } = await setup_api();
  return await _query(signer, contract, method, ...args);
};

export let pub_key = (address) => {
  let publicKey = decodeAddress(address);
  return u8aToHex(publicKey);
};

export let createType = async (type, value) => {
  let { api } = await setup_api();
  api.registry.createType(type, value);
};
