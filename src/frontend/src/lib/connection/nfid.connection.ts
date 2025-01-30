import { Signer } from '@slide-computer/signer';
import { SignerAgent } from '@slide-computer/signer-agent';
import { PostMessageTransport } from '@slide-computer/signer-web';
import { anonPrincipal, connectAnonymously } from './anonymous.connection';
import { HttpAgent } from '@dfinity/agent';
import {
	DelegationChain,
	DelegationIdentity,
	Ed25519KeyIdentity,
	PartialDelegationIdentity,
	PartialIdentity
} from '@dfinity/identity';
import { isNullish } from '@dfinity/utils';
import { getActors } from '$lib/actors/actors.ic';
import type { AuthStoreData } from '@stores/auth.store';
import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';

const STORAGE_KEY = 'nfid_session';

const TRANSPORT_CONFIG = {
	windowOpenerFeatures: 'width=525,height=705',
	establishTimeout: 45000,
	disconnectTimeout: 35000,
	manageFocus: false
};
const url: string = 'https://nfid.one/rpc';

const signerAgent = SignerAgent.createSync({
	signer: new Signer({
		transport: new PostMessageTransport({
			url,
			...TRANSPORT_CONFIG
		})
	}),
	account: anonPrincipal,
	agent: HttpAgent.createSync({ host: url })
});

const { signer } = signerAgent;

let sessionKey: Ed25519KeyIdentity | null | undefined = undefined;
// const delegationStorage: DelegationStorage = new LocalDelegationStorage();

export const nfidLogin = async (set: (this: void, value: AuthStoreData) => void) => {
	try {
		if (isNullish(sessionKey)) {
			// store in browser , ref: https://github.com/dfinity/agent-js/blob/9ab893dd4fb9ef67e8edfd6ad5c37a33f5c833bf/packages/auth-client/src/index.ts#L329
			sessionKey = Ed25519KeyIdentity.generate();
		}

		// local storage of json version ofdelegationChain . ref : https://github.com/dfinity/agent-js/blob/9ab893dd4fb9ef67e8edfd6ad5c37a33f5c833bf/packages/auth-client/src/index.ts#L419
		// user isDelegationValid fn to check its valid on the locally store one. if not create new : ref : https://github.com/dfinity/agent-js/blob/9ab893dd4fb9ef67e8edfd6ad5c37a33f5c833bf/packages/auth-client/src/index.ts#L296
		const delegationChain = await signer.delegation({
			publicKey: sessionKey.getPublicKey().toDer(),
			targets: [], // all the canister Id we are using to interact with
			maxTimeToLive: BigInt(604_800_000_000_000) // 7 days in nanoseconds
		});

		// console.log('sessionKey', sessionKey);

		// console.log('delegationChain', delegationChain);

		const delegationIdentity = DelegationIdentity.fromDelegation(sessionKey, delegationChain);

		// console.log('identity', delegationIdentity);

		signerAgent.replaceAccount(delegationIdentity.getPrincipal());

		const authenticatedActor = await getActors(delegationIdentity);

		set({
			isAuthenticated: true,
			// identity: delegationIdentity,
			identityProvider: 'nfid',
			principal: delegationIdentity.getPrincipal(),
			...authenticatedActor
		});

		goto('/');

		// console.log('NFID COnnnnnect');

		// console.log(delegationIdentity.getPrincipal().toText());
	} catch (error) {
		console.error('Error connecting to NFID:', error);
		toast.error('Failed connecting to NFID');

		await connectAnonymously(set);
	}
};

// https://github.com/microdao-corporation/plug-n-play/blob/5931c7817af26046747e0fdbc4f1a056cee66a96/src/adapters/NFIDAdapter.ts#L329
export const nfidLogout = () => {
	sessionKey = null;
};

// ('{"delegations":[{"delegation":{"expiration":"181fb21e55f677df","pubkey":"3059301306072a8648ce3d020106082a8648ce3d03010703420004df577be38590584be33ce4227c3e96c6bb9f88660589807025bdf9b477b6171fd704ee654825ef10a82b97b5791d9ac2b4d88fc9810b47eb32c06efd8dd6808e"},"signature":"d9d9f7a26b63657274696669636174655904afd9d9f7a36474726565830183018301820458202001489a8230825799705a8e55bebd28654318aea4141b72662cec4389fc143683024863616e697374657283018301830183024a000000000000000701018301830183024e6365727469666965645f646174618203582089fa02c6c1a6ca22710a2d3fefc53b315248e5e6b735b10961d2748efa1f114c82045820d8f64f7afca6a55d4ee6ded9b0200bac6651caf4c7a1920212b5a03c9bf1df3682045820a2ebf235e6d6f42364f59c68ddf08cb2af60524e39a8358d42e84f0a0bb6160282045820c4377acf8e5f4ae6ce619f3ffef462198559354ad0591a8029bf1c626676b62e82045820ddc6ddd9e3d8161200ffd5005130a747852616e1f8acb85f1eeec75093e6ec13820458206707dbf85e37a0f9a4001891d3cb44892b130da6bc42e2f4453a0c6f4bd55ce4820458202bf8c800a02ae3f96633ea914b658d7c6333c0eacb910341ed53d8d4a49b811a8301820458207c79d7f457fd675e57fa9941f733b4d3c51957852c32e770b410cae5619d227083024474696d65820349e1c3c3b69ff1d88f18697369676e617475726558308725b15c314097ecdc60a398922da7944be15f94f18ab31fde2a272c180fa9da50cfef46880470994df68f901bd019856a64656c65676174696f6ea2697375626e65745f6964581d43dcaf1180db82fda708ce3ac7a03a6060abde13e9546c60e8cce65d026b6365727469666963617465590294d9d9f7a264747265658301820458203a687e7223e6016472d44bc1de3553ab9c8dc3df787e2d9abdf3e2501cff6be8830183018204582045c1a316c31427e4c36688f3b6b7cd947545716f1339b061f9e5ede652e0b91f8302467375626e6574830183018301820458200985315bbe905b7f9336d7064793905b005689f3c9c2a21ad9a31fbe6cdd5599830182045820466a70286cf9ace9801ca53e22af6ee059a094fd60498606d484b6854058307d83018301820458208b2f6c15078ae4d3b93470915ca53e373327f37ea74ba1b8177d986bb79b31ae8302581d43dcaf1180db82fda708ce3ac7a03a6060abde13e9546c60e8cce65d02830183024f63616e69737465725f72616e67657382035832d9d9f782824a000000000000000701014a00000000000000070101824a000000000210000001014a00000000021fffff010183024a7075626c69635f6b657982035885308182301d060d2b0601040182dc7c0503010201060c2b0601040182dc7c050302010361008819aaa868da353e3451bb97675fffaa711e3c1c1230e39e1feeb0af9fe03e67c9393f08d796c1e42b528abb5fcb4159199284b00096f6dafa93b4711f1ac65f594b67ce2c0b35710e0391c5424cb754779a1c6084f6e77b584e7c8cf7fe9d89820458202c51db7b5650b7a3dbbb8530a7449cc6f90144778b62f20f3c26d72e95e50698820458206961ef137c2aee0b0467082ef6d3c12c03e93013b602a4cb6214270e484863f18204582043d4dfd12d499f16a488cf0a10ed9df97d13d8d50ecb229b632feae5370abaec83024474696d65820349b78f9196e2dbb58f18697369676e617475726558308ff1eef07bdc032046e7786df24f523521b750d1cc20f01a67b850b025fb60d4e8c42bf6de7a47385185d507794f1ddf6474726565830182045820ce3afbfc6b299ca71aa4620baed172057bffc8ac935e1c7a8ae28c5c4dfe1d35830243736967830182045820d6e6f60ffb0588387db477b289166577358fb5f4d5e5f8db29ccefc2a958c5a9830182045820ef3c5eac435b6524a87f66a698c32ff2ad8fed222b5cdb379e78d4b87b7a7af0830182045820015927916ba9b43931b71ed74a88c1d87963b675ac70e9f5dc9c44d58157fd5e8301820458201e2b6c122a30d22358c54ad384dbae30328d73de7cafcb28660d8135fa5a5a5c83025820d2b89cdc155185b20fbc0703a5b1f5497a255176b22ee1c6b6788c98e37fbe97830258206c2b886629ce0858bfb7954f2ffb9a21132591ee28c48b0b61e8d388f37aa174820340"}],"publicKey":"303c300c060a2b0601040183b8430102032c000a000000000000000701018ab49830805dcaf8d9f1a27b7c1a7840a80fd7a64f582b3710d2e7ee40bfaecd"}');

// PartialDelegationIdentity
