export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const EmailPermission = IDL.Variant({
    'Deny' : IDL.Null,
    'Allow' : IDL.Text,
  });
  return IDL.Service({
    'accept_risk_warning' : IDL.Func([], [Result], []),
    'get_email_permission' : IDL.Func(
        [],
        [IDL.Opt(EmailPermission)],
        ['query'],
      ),
    'get_risk_warning_agreement' : IDL.Func([], [IDL.Opt(IDL.Bool)], ['query']),
    'insert_email' : IDL.Func([IDL.Opt(IDL.Text)], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
