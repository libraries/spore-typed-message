import { helpers, RPC } from '@ckb-lumos/lumos';
import { Config } from "@ckb-lumos/config-manager";
import { createSpore, getSporeConfig, isScriptValueEquals, defaultEmptyWitnessArgs, updateWitnessArgs } from '@spore-sdk/core';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { accounts } from "./rawWallet";
import { createTransactionFromSkeleton, TransactionSkeletonType } from "@ckb-lumos/helpers";
import { values, utils, blockchain, HexString, Hash } from "@ckb-lumos/base";
import { BI } from "@ckb-lumos/bi";
import { bytes } from "@ckb-lumos/codec";
import { Set } from "immutable";
const { CKBHasher, ckbHash } = utils;

const C_SEND_TRANSACTION = false

export async function fetchLocalFile(src: string) {
    const buffer = readFileSync(resolve(__dirname, src));
    return new Uint8Array(buffer).buffer;
}

export function hashWitness(
    hasher: { update: (value: HexString | ArrayBuffer) => unknown },
    witness: HexString
): void {
    const lengthBuffer = new ArrayBuffer(8);
    const view = new DataView(lengthBuffer);
    const witnessHexString = BI.from(bytes.bytify(witness).length).toString(16);
    if (witnessHexString.length <= 8) {
        view.setUint32(0, Number("0x" + witnessHexString), true);
        view.setUint32(4, Number("0x" + "00000000"), true);
    }

    if (witnessHexString.length > 8 && witnessHexString.length <= 16) {
        view.setUint32(0, Number("0x" + witnessHexString.slice(-8)), true);
        view.setUint32(4, Number("0x" + witnessHexString.slice(0, -8)), true);
    }
    hasher.update(lengthBuffer);
    hasher.update(witness);
}

export function prepareSigningEntries(
    txSkeleton: TransactionSkeletonType,
    config: Config,
    scriptType: "SECP256K1_BLAKE160" | "SECP256K1_BLAKE160_MULTISIG" | "OMNILOCK"
): TransactionSkeletonType {
    const template = config.SCRIPTS[scriptType];
    if (!template) {
        throw new Error(
            `Provided config does not have ${scriptType} script setup!`
        );
    }
    let processedArgs = Set<string>();
    const tx = createTransactionFromSkeleton(txSkeleton);
    const txHash = ckbHash(blockchain.RawTransaction.pack(tx));
    const inputs = txSkeleton.get("inputs");
    const witnesses = txSkeleton.get("witnesses");
    let signingEntries = txSkeleton.get("signingEntries");
    for (let i = 0; i < inputs.size; i++) {
        const input = inputs.get(i)!;
        if (
            template.CODE_HASH === input.cellOutput.lock.codeHash &&
            template.HASH_TYPE === input.cellOutput.lock.hashType &&
            !processedArgs.has(input.cellOutput.lock.args)
        ) {
            processedArgs = processedArgs.add(input.cellOutput.lock.args);
            const lockValue = new values.ScriptValue(input.cellOutput.lock, {
                validate: false,
            });
            const hasher = new CKBHasher();
            hasher.update(txHash);
            if (i >= witnesses.size) {
                throw new Error(
                    `The first witness in the script group starting at input index ${i} does not exist, maybe some other part has invalidly tampered the transaction?`
                );
            }
            hashWitness(hasher, witnesses.get(i)!);
            for (let j = i + 1; j < inputs.size && j < witnesses.size; j++) {
                const otherInput = inputs.get(j)!;
                if (
                    lockValue.equals(
                        new values.ScriptValue(otherInput.cellOutput.lock, {
                            validate: false,
                        })
                    )
                ) {
                    hashWitness(hasher, witnesses.get(j)!);
                }
            }
            for (let j = inputs.size; j < witnesses.size; j++) {
                hashWitness(hasher, witnesses.get(j)!);
            }
            const signingEntry = {
                type: "witness_args_lock",
                index: i,
                message: hasher.digestHex(),
            };
            signingEntries = signingEntries.push(signingEntry);
        }
    }
    txSkeleton = txSkeleton.set("signingEntries", signingEntries);
    return txSkeleton;
}

function signTransaction(txSkeleton: helpers.TransactionSkeletonType): helpers.TransactionSkeletonType {
    const signingEntries = txSkeleton.get('signingEntries');
    const signatures = new Map<HexString, Hash>();
    const inputs = txSkeleton.get('inputs');

    let witnesses = txSkeleton.get('witnesses');
    for (let i = 0; i < signingEntries.size; i++) {
        const entry = signingEntries.get(i)!;
        if (entry.type === 'witness_args_lock') {
            // Skip if the input's lock does not match to the wallet's lock
            const input = inputs.get(entry.index);
            if (!input || !isScriptValueEquals(input.cellOutput.lock, accounts.alice.lock)) {
                continue;
            }

            // Sign message
            if (!signatures.has(entry.message)) {
                const sig = accounts.alice.signMessage(entry.message);
                signatures.set(entry.message, sig);
            }

            // Update signature to Transaction.witnesses
            const signature = signatures.get(entry.message)!;
            const witness = witnesses.get(entry.index, defaultEmptyWitnessArgs);
            witnesses = witnesses.set(entry.index, updateWitnessArgs(witness, 'lock', signature));
        }
    }

    return txSkeleton.set('witnesses', witnesses);
}

export async function main() {
    let { txSkeleton } = await createSpore({
        data: {
            contentType: 'image/jpeg',
            content: await fetchLocalFile('../res/nervos.jpg'),
        },
        toLock: accounts.alice.lock,
        fromInfos: [accounts.alice.address],
    });

    const config = getSporeConfig();
    txSkeleton = prepareSigningEntries(txSkeleton, config.lumos, "SECP256K1_BLAKE160");
    txSkeleton = signTransaction(txSkeleton);
    const tx = helpers.createTransactionFromSkeleton(txSkeleton);
    console.log(`Main: Tx is ${JSON.stringify(tx, null, 4)}`)

    if (C_SEND_TRANSACTION) {
        const rpc = new RPC(config.ckbNodeUrl);
        const ret = await rpc.sendTransaction(tx, 'passthrough');
        console.log(`Main: TxHash is ${ret}`)
    }
}

main()
