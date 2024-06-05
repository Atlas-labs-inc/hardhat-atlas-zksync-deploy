"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtlaszkSyncDeployer = void 0;
const deployer_helper_1 = require("./deployer-helper");
/**
 * An entity capable of deploying contracts to the zkSync network.
 * Cannot be used to deploy to zkSync's L1 chain (ethereum)
 */
class AtlaszkSyncDeployer {
    constructor(_hre, zkWallet, // needs to have a connected provider
    deploymentType) {
        this._hre = _hre;
        this.deploymentType = deploymentType;
        if (!zkWallet.provider) {
            throw Error("Provider must be set");
        }
        this.zkSigner = zkWallet;
    }
    async estimateDeployFee(artifact, constructorArguments) {
        return await (0, deployer_helper_1.estimateDeployFee)(this._hre, artifact, constructorArguments, this.zkSigner);
    }
    async estimateDeployGas(artifact, constructorArguments) {
        return await (0, deployer_helper_1.estimateDeployGas)(this._hre, artifact, constructorArguments, this.zkSigner, this.deploymentType);
    }
    async loadArtifact(contractNameOrFullyQualifiedName) {
        return await (0, deployer_helper_1.loadArtifact)(this._hre, contractNameOrFullyQualifiedName);
    }
    async deploy(contractNameOrArtifact, constructorArguments = [], overrides, additionalFactoryDeps) {
        return await (0, deployer_helper_1.deploy)(this._hre, contractNameOrArtifact, constructorArguments, this.zkSigner, this.deploymentType, overrides, additionalFactoryDeps);
    }
}
exports.AtlaszkSyncDeployer = AtlaszkSyncDeployer;
