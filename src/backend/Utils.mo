import Nat8 "mo:base/Nat8";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";

import Account "mo:account-identifier";
import HashMap "mo:base/HashMap";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Nat64 "mo:base/Nat64";

module {

	type HashMap<K, V> = HashMap.HashMap<K, V>;

	type Tokens = {
		#USDx;
	};

	public let accountIdentifier = Account.accountIdentifier;
	public let principalToSubaccountBlob = Account.principalToSubaccount;

	public func trapAnonymous(caller : Principal) : () {
		if (Principal.isAnonymous(caller)) {
			Debug.trap("Anonymous principal cannot mint");
		};
	};

	public func fromNatToNat8Array(len : Nat, n : Nat) : [Nat8] {
		let ith_byte = func(i : Nat) : Nat8 {
			assert (i < len);
			let shift : Nat = 8 * (len - 1 - i);
			Nat8.fromIntWrap(n / 2 ** shift);
		};
		Array.tabulate<Nat8>(len, ith_byte);
	};

	// for subaccount creation
	public func decimal_to_256_base(num : Nat) : [var Nat8] {
		let array = Array.init<Nat8>(32, 0);
		var decimal = num;
		var i = 0;

		while (decimal > 0) {
			array[31 -i] := Nat8.fromNat(decimal % 256);
			decimal := decimal / 256;
			i += 1;
		};
		return array;
	};

	public func toSubAccount(subaccountNumber : Nat) : ?Blob {
		?Blob.fromArrayMut(decimal_to_256_base(subaccountNumber));
	};

	// public func toSubAccount(subaccountNumber : Nat) : ?[Nat8] {
	//     ?Array.freeze(decimal_to_256_base(subaccountNumber));
	// };

	let hexChars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
	public func toHex(arr : [Nat8]) : Text {
		Text.join(
			"",
			Iter.map<Nat8, Text>(
				Iter.fromArray(arr),
				func(x : Nat8) : Text {
					let a = Nat8.toNat(x / 16);
					let b = Nat8.toNat(x % 16);
					hexChars[a] # hexChars[b];
				}
			)
		);
	};

	// Principal to Subaccount
	type Subaccount = [Nat8];

	public func principalToSubaccount(id : Principal) : Subaccount {
		let p = Blob.toArray(Principal.toBlob(id));
		Array.tabulate(
			32,
			func(i : Nat) : Nat8 {
				if (i >= p.size() + 1) 0 else if (i == 0) (Nat8.fromNat(p.size())) else (p[i - 1]);
			}
		)
		|> Blob.toArray(Blob.fromArray(_));
	};

	type Value = {
		#Array : [Value];
		#Blob : [Nat8];
		#Int : Int;
		#Map : [(Text, Value)];
		#Nat : Nat;
		#Nat64 : Nat64;
		#Text : Text;
	};
	type SubValue = {
		#Array : [Value];
		#Blob : [Nat8];
		#Int : Int;
		#Nat : Nat;
		#Nat64 : Nat64;
		#Text : Text;
	};

	// For ICRC block inspection need for Notify functions
	public func formatValueOfBlock(value : Value) : HashMap<Text, SubValue> {

		let hmap = HashMap.HashMap<Text, SubValue>(0, Text.equal, Text.hash);

		func format(value : Value) : SubValue {
			switch (value) {
				case (#Blob blob) { #Blob blob };
				case (#Int int) { #Int int };
				case (#Nat nat) { #Nat nat };
				case (#Nat64 nat64) { #Nat64 nat64 };
				case (#Text text) { #Text text };
				case (#Map map) {
					// Array of keys of this map
					let buffer = Buffer.Buffer<{ #Text : Text }>(0);
					for (element in map.vals()) {
						hmap.put(element.0, format(element.1));
						buffer.add(#Text(element.0));
					};
					#Array(Buffer.toArray(buffer));
				};
				case (#Array array) {
					let buffer = Buffer.Buffer<SubValue>(0);

					for (arrValue in array.vals()) {
						buffer.add(format(arrValue));
					};

					return #Array(Buffer.toArray(buffer));
				};
			};
		};

		let _subValue : SubValue = format(value);

		return hmap;
	};

	// Account Identifier with Subaccount default
	public func accountIdentifierDefault(id : Principal) : [Nat8] {
		Blob.toArray(Account.accountIdentifier(id, Account.defaultSubaccount()));
	};

	public func accountIdentifierDefaultBlob(id : Principal) : Blob {
		Account.accountIdentifier(id, Account.defaultSubaccount());
	};

	public func decimals6to8(decimals6 : Nat) : Nat {
		decimals6 * 100;
	};

	public func timeNowInNat64() : Nat64 {
		return Nat64.fromIntWrap(Time.now());
	};

};
