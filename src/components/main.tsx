'use client'
import { AnchorProvider, Idl, Program, Wallet, web3 } from "@coral-xyz/anchor";
import { Metadata, Metaplex, Nft, Sft } from "@metaplex-foundation/js";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { FC, useCallback, useEffect, useState } from "react";
import nftIDL from '@/abi/nft.json'
import axios from "axios";
import { toast } from 'react-toastify'
import Image from "next/image";
import { publicKey as publicKeyUmi } from "@metaplex-foundation/umi";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { findMasterEditionPda, findMetadataPda, MPL_TOKEN_METADATA_PROGRAM_ID, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const metaplex = new Metaplex(connection);

export const Main: FC = () => {
  const walletSinger= useWallet()
  
  const {wallet, connected, publicKey:userPubKey}  = walletSinger
  const [ nfts, setNfts] = useState<any[]>([])


  const fetchNfts = useCallback(async (address: string) => {
    const provider = new AnchorProvider(connection, wallet as unknown as Wallet);
    const program = new Program(nftIDL as Idl,  provider);
    const [globalState, _bump] = web3.PublicKey.findProgramAddressSync([
      Buffer.from('GLOBAL_STATE_SEED')
    ], program.programId)
    
    const globalStateData = await (program.account as any).globalState.fetch(globalState)
    const nfts = globalStateData.nfts.map((pubkey:PublicKey) => pubkey.toString())
    console.log("NFTs owned by contract", nfts)

    const ownedNfts = (await metaplex.nfts().findAllByOwner({ owner: new PublicKey(address) }, {

    })).filter(ownedNft => {
      for (let i = 0; i < nfts.length; i++) {
        if(ownedNft.model==='metadata')
          if (ownedNft.mintAddress.toString() === nfts[i]) return true
        if(ownedNft.model==='nft')
          if (ownedNft.address.toString() === nfts[i]) return true        
      }
      return false
    });

    const nftMetadatas = await Promise.all(ownedNfts.map(async (nft)=> {
      const { data } = await axios.get(nft.uri)
      return {...data, address: nft.model==='metadata'?nft.mintAddress:nft.address}
    }))

    setNfts(nftMetadatas)

  },[wallet])

  const onBurn = useCallback(async () => {
    if(userPubKey === null){
      toast.error('Connect wallet first.')
      return
    } 
    const provider = new AnchorProvider(connection, walletSinger as unknown as Wallet);
    const program = new Program(nftIDL as Idl,  provider);
    const [globalState, _bump] = web3.PublicKey.findProgramAddressSync([
      Buffer.from('GLOBAL_STATE_SEED')
    ], program.programId)
 
    const mint = new PublicKey(nfts[0].address)
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mint,
      userPubKey
    );
    const tx = await program.rpc.burnNft({
      accounts: {
        user: userPubKey,
        globalState,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
      }
    })
    console.log("Your transaction signature", tx);
    toast.info("Burned successfully.")
    fetchNfts(userPubKey.toString())
  },[fetchNfts, nfts, userPubKey, walletSinger])

  const onMint = useCallback(async () => {
    console.log(userPubKey,'userPubkey')
    if(userPubKey == null) return
    const name = 'Dirt Block'
    const symbol = 'DBlock'
    const uri = "https://tomato-tricky-condor-340.mypinata.cloud/ipfs/QmTn8TqXMTyBky5C4p3uyS1L2EQK5jymbTNdSVhoxzZ8m9/"
    const mint = web3.Keypair.generate();

    const associatedTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      userPubKey
    );

    const provider = new AnchorProvider(connection, walletSinger as unknown as Wallet);
    const signer = provider.wallet;

    const umi = createUmi("https://api.devnet.solana.com")
      .use(walletAdapterIdentity(signer))
      .use(mplTokenMetadata());

    // derive the metadata account
    let metadataAccount = findMetadataPda(umi, {
      mint:publicKeyUmi(mint.publicKey),
    })[0];

    //derive the master edition pda
    let masterEditionAccount = findMasterEditionPda(umi, {
      mint: publicKeyUmi(mint.publicKey),
    })[0];

    const program = new Program(nftIDL as Idl,  provider);

    const [globalState, _bump] = web3.PublicKey.findProgramAddressSync([
      Buffer.from('GLOBAL_STATE_SEED')
    ], program.programId)

    // Add your test here.
    const tx = await program.rpc.mintNft(
      name, symbol, uri,
      {
        accounts: {
          user: userPubKey,
          globalState,
          mint: mint.publicKey,
          associatedTokenAccount,
          metadataAccount,
          masterEditionAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY
        },
        signers: [mint]
      }
    );
    toast.info("Minted successfully.")
    fetchNfts(userPubKey.toString())
    console.log("Your transaction signature", tx);
  },[fetchNfts, userPubKey, walletSinger])

  const onClaim = useCallback(async () => {
    if(nfts.length === 0){
      toast.error("You dont have nfts to claim.")
      return
    }
    if(userPubKey === null){
      toast.error('Connect wallet first.')
      return
    } 
    const provider = new AnchorProvider(connection, walletSinger as unknown as Wallet);
    const program = new Program(nftIDL as Idl,  provider);
    
    const [globalState, _bump] = web3.PublicKey.findProgramAddressSync([
      Buffer.from('GLOBAL_STATE_SEED')
    ], program.programId)
 
    const mint = new PublicKey(nfts[0].address)
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mint,
      userPubKey
    );

    const [vault, _] = web3.PublicKey.findProgramAddressSync([
      Buffer.from("SOL_VAULT_SEED")
    ], program.programId)


    // Add your test here.
    const tx = await program.rpc.claim(
      {
        accounts: {
          user: userPubKey,
          globalState,
          mint,
          vault,
          associatedTokenAccount,
          systemProgram: SystemProgram.programId,
        },
      }
    );
    console.log('Your transcatoin is ', tx )
    toast.info("Claimed successfully.")
  },[walletSinger, nfts, userPubKey])

  useEffect(()=>{
    if(connected && userPubKey?.toString() !== undefined && wallet !== null){
      fetchNfts(userPubKey?.toString())
    }
  },[connected, fetchNfts, userPubKey, wallet])

  return(
    <div className="flex min-h-screen justify-center p-8">

      <div className="w-full">
        <div className="w-full flex  justify-end">
          <WalletMultiButton />
        </div>

        {/* Show user's nfts */}
        <div className="p-4 mt-6">
          <div className="text-center">My NFTs</div>
          <div className="border p-4 flex flex-wrap gap-6">
            {
              nfts.map((nft, index)=>(
                <div key={index} className="flex flex-col w-fit shadow-sm">
                  <Image src={nft.image} alt="NFt" width={300} height={300}/>
                  <p>{nft.name}</p>
                  <p>{nft.description}</p>
                  <div className="flex justify-end px-4">
                    <button className=" font-bold" onClick={onBurn}>BURN</button>
                  </div>
                </div> 
              ))
            }
          </div>
          
        </div>
        {/* Mint, Claim */}
        <div className="flex space-x-4 justify-center">
            <button onClick={onMint} className="border px-2">MINT</button>
            <button onClick={onClaim} className="border px-2">CLAIM</button>

        </div>
      </div>
    </div>
  )
}