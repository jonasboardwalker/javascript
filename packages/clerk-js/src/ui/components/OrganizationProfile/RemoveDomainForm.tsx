import { useOrganization } from '@clerk/shared/react';
import type { OrganizationDomainResource } from '@clerk/types';
import React from 'react';

import { RemoveResourceForm } from '../../common';
import { useEnvironment } from '../../contexts';
import { descriptors, Flex, Spinner } from '../../customizables';
import type { FormProps } from '../../elements';
import { useFetch } from '../../hooks';
import { localizationKeys } from '../../localization';

type RemoveDomainFormProps = FormProps & {
  domainId: string;
};

export const RemoveDomainForm = (props: RemoveDomainFormProps) => {
  const { organizationSettings } = useEnvironment();
  const { organization } = useOrganization();
  const { domainId: id, onSuccess, onReset } = props;

  const ref = React.useRef<OrganizationDomainResource>();
  const { data: domain, isLoading: domainIsLoading } = useFetch(
    organization?.getDomain,
    {
      domainId: id,
    },
    {
      onSuccess(domain) {
        ref.current = { ...domain };
      },
    },
  );

  const { domains } = useOrganization({
    domains: {
      infinite: true,
    },
  });

  if (!organization || !organizationSettings) {
    return null;
  }

  if (domainIsLoading || !domain) {
    return (
      <Flex
        direction={'row'}
        align={'center'}
        justify={'center'}
      >
        <Spinner
          size={'lg'}
          colorScheme={'primary'}
          elementDescriptor={descriptors.spinner}
        />
      </Flex>
    );
  }

  return (
    <RemoveResourceForm
      title={localizationKeys('organizationProfile.general.domainSection.removeDomainScreen.title')}
      messageLine1={localizationKeys('organizationProfile.general.domainSection.removeDomainScreen.messageLine1', {
        domain: ref.current?.name,
      })}
      messageLine2={localizationKeys('organizationProfile.general.domainSection.removeDomainScreen.messageLine2')}
      deleteResource={() =>
        domain?.delete().then(async () => {
          await domains?.revalidate?.();
          onSuccess();
        })
      }
      onSuccess={onSuccess}
      onReset={onReset}
    />
  );
};
