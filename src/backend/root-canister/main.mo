import Map "mo:map/Map";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Buffer "mo:base/Buffer";
import Option "mo:base/Option";
import IC "mo:ic";
import Env "../service/env";

actor {

	type EmailPermission = {
		#Allow : Text;
		#Deny;
	};
	type Result<K, V> = Result.Result<K, V>;

	let { phash } = Map;

	let ic = actor ("aaaaa-aa") : IC.Service;

	private stable let emailMap = Map.new<Principal, EmailPermission>();

	private stable let riskWarningAgreement = Map.new<Principal, Bool>();

	private stable let isBadActorMap = Map.new<Principal, Bool>();

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

	public shared ({ caller }) func accept_risk_warning() : async Result<(), Text> {
		if (Principal.isAnonymous(caller)) return #err("Anonymous User");

		Map.set(riskWarningAgreement, phash, caller, true);

		return #ok();
	};

	public shared query ({ caller }) func get_risk_warning_agreement() : async ?Bool {
		Map.get(riskWarningAgreement, phash, caller);
	};

	public shared ({ caller }) func add_bad_actor(principal : Principal) : async Result<(), Text> {
		if (caller != Principal.fromText(Env.controller)) return #err("Controller only");
		Map.set(isBadActorMap, phash, principal, true);
		return #ok();
	};

	public shared query ({ caller }) func is_bad_actor() : async Bool {
		Option.get(Map.get(isBadActorMap, phash, caller), false);
	};

	public shared ({ caller }) func remove_bad_actor(principal : Principal) : async Result<(), Text> {
		if (caller != Principal.fromText(Env.controller)) return #err("Controller only");
		Map.delete(isBadActorMap, phash, principal);
		return #ok();
	};

	type Canister = {
		#all;
		#frontend;
		#root_canister;
		#stablecoin_minter;
		#staking_canister;
		#dusd_index;
		#dusd_ledger;
		#utility_canister;
		#ckusdc_pool;
	};

	public shared ({ caller }) func stop_canisters(canisters : [Canister]) : async Result<(), Text> {
		if (caller != Principal.fromText(Env.controller)) return #err("Controller only");
		if (canisters.size() == 0) return #err("No canisters to stop");

		for (canister in canisters.vals()) {

			switch (canister) {

				case (#all) {

					for (canister in Env.all_canisters.vals()) {
						await ic.stop_canister({ canister_id = Principal.fromText(canister) });
					};
				};
				case (#frontend) {
					await ic.stop_canister({ canister_id = Principal.fromText(Env.frontend) });
				};
				case (#root_canister) {
					await ic.stop_canister({ canister_id = Principal.fromText(Env.root_canister) });
				};
				case (#stablecoin_minter) {
					await ic.stop_canister({
						canister_id = Principal.fromText(Env.stablecoin_minter);
					});
				};
				case (#staking_canister) {
					await ic.stop_canister({
						canister_id = Principal.fromText(Env.staking_canister);
					});
				};
				case (#dusd_index) {
					await ic.stop_canister({ canister_id = Principal.fromText(Env.dusd_index) });
				};
				case (#dusd_ledger) {
					await ic.stop_canister({ canister_id = Principal.fromText(Env.dusd_ledger) });
				};
				case (#utility_canister) {
					await ic.stop_canister({
						canister_id = Principal.fromText(Env.utility_canister);
					});
				};
				case (#ckusdc_pool) {
					await ic.stop_canister({ canister_id = Principal.fromText(Env.ckusdc_pool) });
				};
			};

		};

		return #ok();

	};

	public shared ({ caller }) func start_canisters(canisters : [Canister]) : async Result<(), Text> {
		if (caller != Principal.fromText(Env.controller)) return #err("Controller only");
		if (canisters.size() == 0) return #err("No canisters to stop");

		for (canister in canisters.vals()) {

			switch (canister) {

				case (#all) {

					for (canister in Env.all_canisters.vals()) {
						await ic.start_canister({ canister_id = Principal.fromText(canister) });
					};
				};
				case (#frontend) {
					await ic.start_canister({ canister_id = Principal.fromText(Env.frontend) });
				};
				case (#root_canister) {
					await ic.start_canister({ canister_id = Principal.fromText(Env.root_canister) });
				};
				case (#stablecoin_minter) {
					await ic.start_canister({
						canister_id = Principal.fromText(Env.stablecoin_minter);
					});
				};
				case (#staking_canister) {
					await ic.start_canister({
						canister_id = Principal.fromText(Env.staking_canister);
					});
				};
				case (#dusd_index) {
					await ic.start_canister({ canister_id = Principal.fromText(Env.dusd_index) });
				};
				case (#dusd_ledger) {
					await ic.start_canister({ canister_id = Principal.fromText(Env.dusd_ledger) });
				};
				case (#utility_canister) {
					await ic.start_canister({
						canister_id = Principal.fromText(Env.utility_canister);
					});
				};
				case (#ckusdc_pool) {
					await ic.start_canister({ canister_id = Principal.fromText(Env.ckusdc_pool) });
				};
			};

		};

		return #ok();

	};

	public shared ({ caller }) func canisters_status(canisters : [Canister]) : async Result<[IC.CanisterStatusResult], Text> {
		if (caller != Principal.fromText(Env.controller)) return #err("Controller only");
		if (canisters.size() == 0) return #err("No canisters to get status");

		let statusess = Buffer.Buffer<IC.CanisterStatusResult>(canisters.size());

		for (canister in canisters.vals()) {

			switch (canister) {

				case (#all) {

					for (canister in Env.all_canisters.vals()) {
						let status = await ic.canister_status({
							canister_id = Principal.fromText(canister);
						});

						statusess.add(status);
					};
				};
				case (#frontend) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.frontend);
					});
					statusess.add(status);
				};
				case (#root_canister) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.root_canister);
					});
					statusess.add(status);
				};
				case (#stablecoin_minter) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.stablecoin_minter);
					});
					statusess.add(status);
				};
				case (#staking_canister) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.staking_canister);
					});
					statusess.add(status);
				};
				case (#dusd_index) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.dusd_index);
					});
					statusess.add(status);
				};
				case (#dusd_ledger) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.dusd_ledger);
					});
					statusess.add(status);
				};
				case (#utility_canister) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.utility_canister);
					});
					statusess.add(status);
				};
				case (#ckusdc_pool) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.ckusdc_pool);
					});
					statusess.add(status);
				};
			};

		};

		return #ok(Buffer.toArray(statusess));

	};

	public shared ({ caller }) func canister_balances(canisters : [Canister]) : async Result<[(Text, Nat)], Text> {
		if (caller != Principal.fromText(Env.controller)) return #err("Controller only");
		if (canisters.size() == 0) return #err("No canisters to get status");

		let statusess = Buffer.Buffer<(Text, Nat)>(canisters.size());

		for (canister in canisters.vals()) {

			switch (canister) {

				case (#all) {

					var status = await ic.canister_status({
						canister_id = Principal.fromText(Env.frontend);
					});
					statusess.add(("frontend", status.cycles));

					status := await ic.canister_status({
						canister_id = Principal.fromText(Env.root_canister);
					});
					statusess.add(("root_canister", status.cycles));

					status := await ic.canister_status({
						canister_id = Principal.fromText(Env.stablecoin_minter);
					});
					statusess.add(("stablecoin_minter", status.cycles));

					status := await ic.canister_status({
						canister_id = Principal.fromText(Env.staking_canister);
					});
					statusess.add(("staking_canister", status.cycles));

					status := await ic.canister_status({
						canister_id = Principal.fromText(Env.dusd_index);
					});
					statusess.add(("dusd_index", status.cycles));

					status := await ic.canister_status({
						canister_id = Principal.fromText(Env.dusd_ledger);
					});
					statusess.add(("dusd_ledger", status.cycles));

					status := await ic.canister_status({
						canister_id = Principal.fromText(Env.utility_canister);
					});
					statusess.add(("utility_canister", status.cycles));

					status := await ic.canister_status({
						canister_id = Principal.fromText(Env.ckusdc_pool);
					});
					statusess.add(("ckusdc_pool", status.cycles));

				};
				case (#frontend) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.frontend);
					});
					statusess.add(("frontend", status.cycles));
				};
				case (#root_canister) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.root_canister);
					});
					statusess.add(("root_canister", status.cycles));
				};
				case (#stablecoin_minter) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.stablecoin_minter);
					});
					statusess.add(("stablecoin_minter", status.cycles));
				};
				case (#staking_canister) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.staking_canister);
					});
					statusess.add(("staking_canister", status.cycles));
				};
				case (#dusd_index) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.dusd_index);
					});
					statusess.add(("dusd_index", status.cycles));
				};
				case (#dusd_ledger) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.dusd_ledger);
					});
					statusess.add(("dusd_ledger", status.cycles));
				};
				case (#utility_canister) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.utility_canister);
					});
					statusess.add(("utility_canister", status.cycles));
				};
				case (#ckusdc_pool) {
					let status = await ic.canister_status({
						canister_id = Principal.fromText(Env.ckusdc_pool);
					});
					statusess.add(("ckusdc_pool", status.cycles));
				};
			};

		};

		return #ok(Buffer.toArray(statusess));

	}

};
