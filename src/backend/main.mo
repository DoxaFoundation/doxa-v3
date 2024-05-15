import Principal "mo:base/Principal";
actor {
	public shared query func greet(name : Text) : async Text {
		return "Hello, " # name # "!";
	};

	public shared query ({ caller }) func whoami() : async Text {
		return "I am an with the principal!   " # Principal.toText(caller);
	};
};
