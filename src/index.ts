import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import * as ethers from 'ethers';

import { AbstractDeployer } from '@matterlabs/hardhat-zksync-deploy/src/abstract-deployer';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import {
    Providers,
    createProviders,
    deploy,
    estimateDeployFee,
    estimateDeployGas,
    loadArtifact,
} from './deployer-helper';

/**
 * An entity capable of deploying contracts to the zkSync network.
 * Cannot be used to deploy to zkSync's L1 chain (ethereum)
 */
export class AtlaszkSyncDeployer implements AbstractDeployer {
    public zkSigner: zk.Signer;
    public deploymentType?: zk.types.DeploymentType;

    constructor(
        private _hre: HardhatRuntimeEnvironment,
        zkWallet: zk.Signer, // needs to have a connected provider
        deploymentType?: zk.types.DeploymentType,
    ) {
        this.deploymentType = deploymentType;

        if(!zkWallet.provider){
			throw Error("Provider must be set");
		}
        this.zkSigner = zkWallet; 
    }


    public async estimateDeployFee(artifact: ZkSyncArtifact, constructorArguments: any[]): Promise<bigint> {
        return await estimateDeployFee(this._hre, artifact, constructorArguments, this.zkSigner);
    }

    public async estimateDeployGas(artifact: ZkSyncArtifact, constructorArguments: any[]): Promise<bigint> {
        return await estimateDeployGas(this._hre, artifact, constructorArguments, this.zkSigner, this.deploymentType);
    }

    public async loadArtifact(contractNameOrFullyQualifiedName: string): Promise<ZkSyncArtifact> {
        return await loadArtifact(this._hre, contractNameOrFullyQualifiedName);
    }

    public async deploy(
        contractNameOrArtifact: ZkSyncArtifact | string,
        constructorArguments: any[] = [],
        overrides?: ethers.Overrides,
        additionalFactoryDeps?: ethers.BytesLike[],
    ): Promise<zk.Contract> {
		
        return await deploy(
            this._hre,
            contractNameOrArtifact,
            constructorArguments,
            this.zkSigner,
            this.deploymentType,
            overrides,
            additionalFactoryDeps,
        );
    }
}

export const getDeployer = async (hre: HardhatRuntimeEnvironment): Promise<{signer: ethers.JsonRpcSigner & {provider: zk.Provider}, deployer: AtlaszkSyncDeployer, provider: zk.Provider}> => {
	// @ts-ignore
	const atlasRpc: string = hre.config.networks.atlas.url;

	const zksyncProvider = new zk.Provider(atlasRpc, undefined, {batchMaxCount: 1});

	const signer = await zksyncProvider.getSigner() as ethers.JsonRpcSigner & {provider: zk.Provider};

	const deployer = new AtlaszkSyncDeployer(
		hre,
		zk.Signer.from(
			signer,
			Number((await zksyncProvider.getNetwork()).chainId.toString()),
			zksyncProvider
		)
	)
	return {signer, deployer, provider: zksyncProvider};
};

