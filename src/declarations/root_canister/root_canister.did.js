export const idlFactory = ({ IDL }) => {
  const EmailPermission = IDL.Variant({
    'Deny' : IDL.Null,
    'Allow' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  return IDL.Service({
    'get_email_permission' : IDL.Func(
        [],
        [IDL.Opt(EmailPermission)],
        ['query'],
      ),
    'insert_email' : IDL.Func([IDL.Opt(IDL.Text)], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
