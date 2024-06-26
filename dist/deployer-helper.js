"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProviders = exports._extractFactoryDepsRecursive = exports._extractFactoryDeps = exports.estimateDeployGas = exports.estimateDeployFee = exports.deploy = exports.loadArtifact = void 0;
const zk = require("zksync-ethers");
const ethers = require("ethers");
const utils_1 = require("@matterlabs/hardhat-zksync-deploy/dist/utils");
const deployment_saver_1 = require("@matterlabs/hardhat-zksync-deploy/dist/deployment-saver");
const constants_1 = require("@matterlabs/hardhat-zksync-deploy/dist/constants");
const errors_1 = require("@matterlabs/hardhat-zksync-deploy/dist/errors");
const ZKSOLC_ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';
const ZKVYPER_ARTIFACT_FORMAT_VERSION = 'hh-zkvyper-artifact-1';
const SUPPORTED_L1_TESTNETS = ['mainnet', 'rinkeby', 'ropsten', 'kovan', 'goerli', 'sepolia'];
/**
 * Loads an artifact and verifies that it was compiled by `zksolc`.
 *
 * @param contractNameOrFullyQualifiedName The name of the contract.
 *   It can be a contract bare contract name (e.g. "Token") if it's
 *   unique in your project, or a fully qualified contract name
 *   (e.g. "contract/token.sol:Token") otherwise.
 *
 * @throws Throws an error if a non-unique contract name is used,
 *   indicating which fully qualified names can be used instead.
 *
 * @throws Throws an error if an artifact was not compiled by `zksolc`.
 */
async function loadArtifact(hre, contractNameOrFullyQualifiedName) {
    const artifact = await hre.artifacts.readArtifact(contractNameOrFullyQualifiedName);
    // Verify that this artifact was compiled by the zkSync compiler, and not `solc` or `vyper`.
    if (artifact._format !== ZKSOLC_ARTIFACT_FORMAT_VERSION && artifact._format !== ZKVYPER_ARTIFACT_FORMAT_VERSION) {
        throw new errors_1.ZkSyncDeployPluginError(`Artifact ${contractNameOrFullyQualifiedName} was not compiled by zksolc or zkvyper`);
    }
    return artifact;
}
exports.loadArtifact = loadArtifact;
/**
 * Sends a deploy transaction to the zkSync network.
 * For now, it will use defaults for the transaction parameters:
 * - fee amount is requested automatically from the zkSync server.
 *
 * @param artifact The previously loaded artifact object.
 * @param constructorArguments List of arguments to be passed to the contract constructor.
 * @param overrides Optional object with additional deploy transaction parameters.
 * @param additionalFactoryDeps Additional contract bytecodes to be added to the factory dependencies list.
 *
 * @returns A contract object.
 */
async function deploy(hre, contractNameOrArtifact, constructorArguments = [], zkWallet, deploymentType = 'create', overrides, additionalFactoryDeps) {
    var _a, _b, _c, _d;
    const artifact = typeof contractNameOrArtifact === 'string'
        ? await loadArtifact(hre, contractNameOrArtifact)
        : contractNameOrArtifact;
    const baseDeps = await _extractFactoryDeps(hre, artifact);
    const additionalDeps = additionalFactoryDeps ? additionalFactoryDeps.map((val) => ethers.hexlify(val)) : [];
    const factoryDeps = [...baseDeps, ...additionalDeps];
    const deploymentEntry = await (0, deployment_saver_1.loadCache)(hre, artifact, deploymentType, constructorArguments, (_b = (_a = overrides === null || overrides === void 0 ? void 0 : overrides.customData) === null || _a === void 0 ? void 0 : _a.salt) !== null && _b !== void 0 ? _b : ethers.ZeroHash, factoryDeps);
    if (!hre.network.forceDeploy && deploymentEntry) {
        return new zk.Contract(deploymentEntry.address, artifact.abi, zkWallet);
    }
    const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, zkWallet, deploymentType);
    const _e = overrides !== null && overrides !== void 0 ? overrides : {}, { customData } = _e, _overrides = __rest(_e, ["customData"]);
    // Encode and send the deploy transaction providing factory dependencies.
    const contract = await factory.deploy(...constructorArguments, Object.assign(Object.assign({}, _overrides), { customData: Object.assign(Object.assign({}, customData), { factoryDeps }) }));
    await contract.waitForDeployment();
    await (0, deployment_saver_1.saveCache)(hre, artifact, {
        constructorArgs: constructorArguments,
        salt: (_d = (_c = overrides === null || overrides === void 0 ? void 0 : overrides.customData) === null || _c === void 0 ? void 0 : _c.salt) !== null && _d !== void 0 ? _d : ethers.ZeroHash,
        deploymentType,
        factoryDeps,
        address: await contract.getAddress(),
        txHash: contract.deploymentTransaction().hash,
    });
    return contract;
}
exports.deploy = deploy;
/**
 * Estimates the price of calling a deploy transaction in ETH.
 *
 * @param artifact The previously loaded artifact object.
 * @param constructorArguments List of arguments to be passed to the contract constructor.
 *
 * @returns Calculated fee in ETH wei
 */
async function estimateDeployFee(hre, artifact, constructorArguments, zkWallet) {
    const gas = await estimateDeployGas(hre, artifact, constructorArguments, zkWallet);
    const gasPrice = await zkWallet.provider.getGasPrice();
    return gas * gasPrice;
}
exports.estimateDeployFee = estimateDeployFee;
/**
 * Estimates the amount of gas needed to execute a deploy transaction.
 *
 * @param artifact The previously loaded artifact object.
 * @param constructorArguments List of arguments to be passed to the contract constructor.
 *
 * @returns Calculated amount of gas.
 */
async function estimateDeployGas(hre, artifact, constructorArguments, zkWallet, deploymentType = 'create') {
    const factoryDeps = await _extractFactoryDeps(hre, artifact);
    const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, zkWallet, deploymentType);
    // Encode deploy transaction so it can be estimated.
    const deployTx = await factory.getDeployTransaction(...constructorArguments, {
        customData: {
            factoryDeps,
        },
    });
    deployTx.from = zkWallet.address;
    return await zkWallet.provider.estimateGas(deployTx);
}
exports.estimateDeployGas = estimateDeployGas;
/**
 * Extracts factory dependencies from the artifact.
 *
 * @param artifact Artifact to extract dependencies from
 *
 * @returns Factory dependencies in the format expected by SDK.
 */
async function _extractFactoryDeps(hre, artifact) {
    const visited = new Set();
    visited.add(`${artifact.sourceName}:${artifact.contractName}`);
    return await _extractFactoryDepsRecursive(hre, artifact, visited);
}
exports._extractFactoryDeps = _extractFactoryDeps;
async function _extractFactoryDepsRecursive(hre, artifact, visited) {
    // Load all the dependency bytecodes.
    // We transform it into an array of bytecodes.
    const factoryDeps = [];
    for (const dependencyHash in artifact.factoryDeps) {
        if (!dependencyHash)
            continue;
        const dependencyContract = artifact.factoryDeps[dependencyHash];
        if (!visited.has(dependencyContract)) {
            const dependencyArtifact = await loadArtifact(hre, dependencyContract);
            factoryDeps.push(dependencyArtifact.bytecode);
            visited.add(dependencyContract);
            const transitiveDeps = await _extractFactoryDepsRecursive(hre, dependencyArtifact, visited);
            factoryDeps.push(...transitiveDeps);
        }
    }
    return factoryDeps;
}
exports._extractFactoryDepsRecursive = _extractFactoryDepsRecursive;
function createProviders(networks, network) {
    const networkName = network.name;
    if (!network.zksync) {
        throw new errors_1.ZkSyncDeployPluginError(`Only deploying to zkSync network is supported.\nNetwork '${networkName}' in 'hardhat.config' needs to have 'zksync' flag set to 'true'.`);
    }
    if (networkName === 'hardhat') {
        return {
            ethWeb3Provider: _createDefaultEthProvider(),
            zkWeb3Provider: _createDefaultZkProvider(),
        };
    }
    const networkConfig = network.config;
    if (!(0, utils_1.isHttpNetworkConfig)(networkConfig)) {
        throw new errors_1.ZkSyncDeployPluginError(`Only deploying to zkSync network is supported.\nNetwork '${networkName}' in 'hardhat.config' needs to have 'url' specified.`);
    }
    if (networkConfig.ethNetwork === undefined) {
        throw new errors_1.ZkSyncDeployPluginError(`Only deploying to zkSync network is supported.\nNetwork '${networkName}' in 'hardhat.config' needs to have 'ethNetwork' (layer 1) specified.`);
    }
    let ethWeb3Provider;
    const ethNetwork = networkConfig.ethNetwork;
    if (SUPPORTED_L1_TESTNETS.includes(ethNetwork)) {
        ethWeb3Provider =
            ethNetwork in networks && (0, utils_1.isHttpNetworkConfig)(networks[ethNetwork])
                ? new ethers.JsonRpcProvider(networks[ethNetwork].url)
                : ethers.getDefaultProvider(ethNetwork);
    }
    else {
        if (ethNetwork === 'localhost' || ethNetwork === '') {
            ethWeb3Provider = _createDefaultEthProvider();
        }
        else if ((0, utils_1.isValidEthNetworkURL)(ethNetwork)) {
            ethWeb3Provider = new ethers.JsonRpcProvider(ethNetwork);
        }
        else {
            ethWeb3Provider =
                ethNetwork in networks && (0, utils_1.isHttpNetworkConfig)(networks[ethNetwork])
                    ? new ethers.JsonRpcProvider(networks[ethNetwork].url)
                    : ethers.getDefaultProvider(ethNetwork);
        }
    }
    const zkWeb3Provider = new zk.Provider(network.config.url);
    return { ethWeb3Provider, zkWeb3Provider };
}
exports.createProviders = createProviders;
function _createDefaultEthProvider() {
    return new ethers.JsonRpcProvider(constants_1.ETH_DEFAULT_NETWORK_RPC_URL);
}
function _createDefaultZkProvider() {
    return zk.Provider.getDefaultProvider();
}
