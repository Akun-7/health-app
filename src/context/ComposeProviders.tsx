import type { ReactNode, ComponentType } from 'react';

type ProviderComponent = ComponentType<{ children: ReactNode }>;

export function ComposeProviders({ providers, children }: { providers: ProviderComponent[]; children: ReactNode }) {
  return providers.reduceRight<ReactNode>((acc, Provider) => <Provider>{acc}</Provider>, children);
}
