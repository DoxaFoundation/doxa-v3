export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'get_prices_from_ckusdc_pools' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Float64))],
        ['composite_query'],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
