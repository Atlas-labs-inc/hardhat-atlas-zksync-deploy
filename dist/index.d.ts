import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import * as ethers from 'ethers';
import { AbstractDeployer } from '@matterlabs/hardhat-zksync-deploy/src/abstract-deployer';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
/**
 * An entity capable of deploying contracts to the zkSync network.
 * Cannot be used to deploy to zkSync's L1 chain (ethereum)
 */
export declare class AtlaszkSyncDeployer implements AbstractDeployer {
    private _hre;
    zkSigner: zk.Signer;
    deploymentType?: zk.types.DeploymentType;
    constructor(_hre: HardhatRuntimeEnvironment, zkWallet: zk.Signer, // needs to have a connected provider
    deploymentType?: zk.types.DeploymentType);
    estimateDeployFee(artifact: ZkSyncArtifact, constructorArguments: any[]): Promise<bigint>;
    estimateDeployGas(artifact: ZkSyncArtifact, constructorArguments: any[]): Promise<bigint>;
    loadArtifact(contractNameOrFullyQualifiedName: string): Promise<ZkSyncArtifact>;
    deploy(contractNameOrArtifact: ZkSyncArtifact | string, constructorArguments?: any[], overrides?: ethers.Overrides, additionalFactoryDeps?: ethers.BytesLike[]): Promise<zk.Contract>;
}
