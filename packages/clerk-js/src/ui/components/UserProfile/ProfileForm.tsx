import { useUser } from '@clerk/shared/react';
import React from 'react';

import { isDefaultImage } from '../../../utils';
import { useEnvironment } from '../../contexts';
import { localizationKeys } from '../../customizables';
import type { FormProps } from '../../elements';
import { Form, FormButtons, FormContainer, InformationBox, useCardState, withCardStateProvider } from '../../elements';
import { handleError, useFormControl } from '../../utils';
import { UserProfileAvatarUploader } from './UserProfileAvatarUploader';

type ProfileFormProps = FormProps;

export const ProfileForm = withCardStateProvider((props: ProfileFormProps) => {
  const { onSuccess, onReset } = props;
  const card = useCardState();
  const { user } = useUser();

  if (!user) {
    return null;
  }

  const [avatarChanged, setAvatarChanged] = React.useState(false);
  const { first_name, last_name } = useEnvironment().userSettings.attributes;
  const showFirstName = first_name.enabled;
  const showLastName = last_name.enabled;
  const userFirstName = user.firstName || '';
  const userLastName = user.lastName || '';

  const firstNameField = useFormControl('firstName', user.firstName || '', {
    type: 'text',
    label: localizationKeys('formFieldLabel__firstName'),
    placeholder: localizationKeys('formFieldInputPlaceholder__firstName'),
    isRequired: last_name.required,
  });
  const lastNameField = useFormControl('lastName', user.lastName || '', {
    type: 'text',
    label: localizationKeys('formFieldLabel__lastName'),
    placeholder: localizationKeys('formFieldInputPlaceholder__lastName'),
    isRequired: last_name.required,
  });

  const userInfoChanged =
    (showFirstName && firstNameField.value !== userFirstName) || (showLastName && lastNameField.value !== userLastName);
  const optionalFieldsChanged = userInfoChanged || avatarChanged;

  const hasRequiredFields = (showFirstName && first_name.required) || (showLastName && last_name.required);
  const requiredFieldsFilled =
    hasRequiredFields && !!lastNameField.value && !!firstNameField.value && optionalFieldsChanged;

  const nameEditDisabled = user.samlAccounts.some(sa => sa.active);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    return (
      userInfoChanged
        ? user.update({ firstName: firstNameField.value, lastName: lastNameField.value })
        : Promise.resolve()
    )
      .then(onSuccess)
      .catch(err => {
        handleError(err, [firstNameField, lastNameField], card.setError);
      });
  };

  const uploadAvatar = (file: File) => {
    return user
      .setProfileImage({ file })
      .then(() => {
        setAvatarChanged(true);
        card.setIdle();
      })
      .catch(err => handleError(err, [], card.setError));
  };

  const onAvatarRemove = () => {
    void user
      .setProfileImage({ file: null })
      .then(() => {
        setAvatarChanged(true);
        card.setIdle();
      })
      .catch(err => handleError(err, [], card.setError));
  };

  return (
    <FormContainer headerTitle={localizationKeys('userProfile.profile.profileSection.profileScreen.title')}>
      {nameEditDisabled && (
        <InformationBox message={localizationKeys('userProfile.profile.profileSection.profileScreen.readonly')} />
      )}

      <Form.Root onSubmit={onSubmit}>
        <UserProfileAvatarUploader
          user={user}
          onAvatarChange={uploadAvatar}
          onAvatarRemove={isDefaultImage(user.imageUrl) ? null : onAvatarRemove}
        />
        {(showFirstName || showLastName) && (
          <Form.ControlRow elementId='name'>
            {showFirstName && (
              <Form.PlainInput
                {...firstNameField.props}
                isDisabled={nameEditDisabled}
                autoFocus
              />
            )}
            {showLastName && (
              <Form.PlainInput
                {...lastNameField.props}
                isDisabled={nameEditDisabled}
                autoFocus={!showFirstName}
              />
            )}
          </Form.ControlRow>
        )}

        <FormButtons
          isDisabled={hasRequiredFields ? !requiredFieldsFilled : !optionalFieldsChanged}
          onReset={onReset}
        />
      </Form.Root>
    </FormContainer>
  );
});
