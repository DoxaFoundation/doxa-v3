import Map "mo:map/Map";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
actor {

	type EmailPermission = {
		#Allow : Text;
		#Deny;
	};
	type Result<K, V> = Result.Result<K, V>;

	let { phash } = Map;

	private stable let emailMap = Map.new<Principal, EmailPermission>();

	public query ({ caller }) func get_email_permission() : async ?EmailPermission {
		Map.get(emailMap, phash, caller);
	};

	public shared ({ caller }) func insert_email(email : ?Text) : async Result<(), Text> {
		if (Principal.isAnonymous(caller)) return #err("Anonymous User");

		switch (Map.get(emailMap, phash, caller)) {

			case (null) {

				switch (email) {
					case (?value) { Map.set(emailMap, phash, caller, #Allow value) };
					case (null) { Map.set(emailMap, phash, caller, #Deny) };
				};

				return #ok()

			};

			case (?_) { #err("Already provided") };
		};
	};
};
