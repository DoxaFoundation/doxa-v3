import Text "mo:base/Text";
import Nat "mo:base/Nat";
import HashMap "mo:base/HashMap";
import Float "mo:base/Float";

module {

	public func getTokenFeeMap() : HashMap.HashMap<Text, Nat> {
		let map = HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);
		map.put("ryjl3-tyaaa-aaaaa-aaaba-cai", 10_000);
		map.put("xevnm-gaaaa-aaaar-qafnq-cai", 10_000);
		map.put("irorr-5aaaa-aaaak-qddsq-cai", 10_000);
		map.put("mxzaz-hqaaa-aaaar-qaada-cai", 10);
		map.put("ss2fx-dyaaa-aaaar-qacoq-cai", 2_000_000_000_000);
		map.put("cngnf-vqaaa-aaaar-qag4q-cai", 10_000);
		map;
	};
	public func getDecimalsMap() : HashMap.HashMap<Text, Nat> {
		let map = HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);
		map.put("ryjl3-tyaaa-aaaaa-aaaba-cai", 8);
		map.put("xevnm-gaaaa-aaaar-qafnq-cai", 6);
		map.put("irorr-5aaaa-aaaak-qddsq-cai", 6);
		map.put("mxzaz-hqaaa-aaaar-qaada-cai", 8);
		map.put("ss2fx-dyaaa-aaaar-qacoq-cai", 18);
		map.put("cngnf-vqaaa-aaaar-qag4q-cai", 6);
		map;
	};

	public func sortToken(token0 : Text, token1 : Text) : (Text, Text) {
		if (token0 > token1) { (token1, token0) } else { (token0, token1) };
	};

	public func getTokenPriceMap() : HashMap.HashMap<Text, Float> {
		let map = HashMap.HashMap<Text, Float>(0, Text.equal, Text.hash);
		map.put("ryjl3-tyaaa-aaaaa-aaaba-cai", 7.0);
		map.put("irorr-5aaaa-aaaak-qddsq-cai", 1.0);
		map.put("xevnm-gaaaa-aaaar-qafnq-cai", 1.0);
		map.put("mxzaz-hqaaa-aaaar-qaada-cai", 100_000.0);
		map.put("ss2fx-dyaaa-aaaar-qacoq-cai", 3_000.0);
		map.put("cngnf-vqaaa-aaaar-qag4q-cai", 1.0);
		map;
	};

	public func getTokenNameMap() : HashMap.HashMap<Text, Text> {
		let map = HashMap.HashMap<Text, Text>(0, Text.equal, Text.hash);
		map.put("ryjl3-tyaaa-aaaaa-aaaba-cai", "ICP");
		map.put("xevnm-gaaaa-aaaar-qafnq-cai", "ckUSDC");
		map.put("irorr-5aaaa-aaaak-qddsq-cai", "USDx");
		map.put("mxzaz-hqaaa-aaaar-qaada-cai", "ckBTC");
		map.put("ss2fx-dyaaa-aaaar-qacoq-cai", "ckETH");
		map.put("cngnf-vqaaa-aaaar-qag4q-cai", "ckUSDT");
		map;
	};
};
