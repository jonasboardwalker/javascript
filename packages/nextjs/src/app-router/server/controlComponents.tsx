import type { experimental__CheckAuthorizationWithCustomPermissions } from '@clerk/types';
import { redirect } from 'next/navigation';
import React from 'react';

import { auth } from './auth';

export function SignedIn(props: React.PropsWithChildren) {
  const { children } = props;
  const { userId } = auth();
  return userId ? <>{children}</> : null;
}

export function SignedOut(props: React.PropsWithChildren) {
  const { children } = props;
  const { userId } = auth();
  return userId ? null : <>{children}</>;
}

type GateServerComponentProps = React.PropsWithChildren<
  Parameters<experimental__CheckAuthorizationWithCustomPermissions>[0] &
    (
      | {
          fallback: React.ReactNode;
          redirectTo?: never;
        }
      | {
          fallback?: never;
          redirectTo: string;
        }
    )
>;

/**
 * @experimental The component is experimental and subject to change in future releases.
 */
export function experimental__Gate(gateProps: GateServerComponentProps) {
  const { children, fallback, redirectTo, ...restAuthorizedParams } = gateProps;
  const { experimental__has } = auth();

  const isAuthorizedUser = experimental__has(restAuthorizedParams);

  if (!redirectTo && !fallback) {
    throw new Error('Provide `<Gate />` with a `fallback` or `redirectTo`');
  }

  const handleFallback = () => {
    if (redirectTo) {
      return redirect(redirectTo);
    }

    return <>{fallback}</>;
  };

  if (!isAuthorizedUser) {
    return handleFallback();
  }

  return <>{children}</>;
}
