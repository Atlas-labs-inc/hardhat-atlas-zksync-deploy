import { HardhatRuntimeEnvironment, Network, NetworksConfig } from 'hardhat/types';
import { DeploymentType } from 'zksync-ethers/build/types';
import * as zk from 'zksync-ethers';
import * as ethers from 'ethers';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/dist/types';
export interface Providers {
    zkWeb3Provider: zk.Provider;
}
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
export declare function loadArtifact(hre: HardhatRuntimeEnvironment, contractNameOrFullyQualifiedName: string): Promise<ZkSyncArtifact>;
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
export declare function deploy(hre: HardhatRuntimeEnvironment, contractNameOrArtifact: ZkSyncArtifact | string, constructorArguments: any[], zkWallet: zk.Signer, deploymentType?: DeploymentType, overrides?: ethers.Overrides, additionalFactoryDeps?: ethers.BytesLike[]): Promise<zk.Contract>;
/**
 * Estimates the price of calling a deploy transaction in ETH.
 *
 * @param artifact The previously loaded artifact object.
 * @param constructorArguments List of arguments to be passed to the contract constructor.
 *
 * @returns Calculated fee in ETH wei
 */
export declare function estimateDeployFee(hre: HardhatRuntimeEnvironment, artifact: ZkSyncArtifact, constructorArguments: any[], zkWallet: zk.Signer): Promise<bigint>;
/**
 * Estimates the amount of gas needed to execute a deploy transaction.
 *
 * @param artifact The previously loaded artifact object.
 * @param constructorArguments List of arguments to be passed to the contract constructor.
 *
 * @returns Calculated amount of gas.
 */
export declare function estimateDeployGas(hre: HardhatRuntimeEnvironment, artifact: ZkSyncArtifact, constructorArguments: any[], zkWallet: zk.Signer, deploymentType?: DeploymentType): Promise<bigint>;
/**
 * Extracts factory dependencies from the artifact.
 *
 * @param artifact Artifact to extract dependencies from
 *
 * @returns Factory dependencies in the format expected by SDK.
 */
export declare function _extractFactoryDeps(hre: HardhatRuntimeEnvironment, artifact: ZkSyncArtifact): Promise<string[]>;
export declare function _extractFactoryDepsRecursive(hre: HardhatRuntimeEnvironment, artifact: ZkSyncArtifact, visited: Set<string>): Promise<string[]>;
export declare function createProviders(networks: NetworksConfig, network: Network): {
    ethWeb3Provider: ethers.Provider;
    zkWeb3Provider: zk.Provider;
};
