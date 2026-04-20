import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banner, Button, Field, PageHeader, inputClass } from '../components/UI';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';

const initialFormState = {
  name: '',
  email: '',
  phoneNumber: '',
  password: '',
  userType: 'OWNER',
};

const userTypeOptions = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'TENANT', label: 'Tenant' },
  { value: 'SECURITY', label: 'Security' },
];

const ManualUserRegistrationPage = () => {
  const [form, setForm] = useState(initialFormState);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await api.post('/admin/users', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        userType: form.userType,
      });

      setForm(initialFormState);
      setMessage({
        tone: 'success',
        text: response.data?.message || 'User created successfully.',
      });
    } catch (requestError) {
      setMessage({
        tone: 'error',
        text: getApiErrorMessage(requestError, 'Failed to create user'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="text-[13px]">
      <PageHeader
        eyebrow="Fallback Access"
        title="Manual User Registration"
        actions={
          <Link to="/users">
            <Button variant="secondary">View Users</Button>
          </Link>
        }
      />

      {message && <Banner tone={message.tone}>{message.text}</Banner>}

      <section className="border-b border-slate-200 px-5 py-5">
        <div className="max-w-3xl">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
            <Field label="Full Name" className="md:col-span-2">
              <input
                className={inputClass}
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Enter full name"
                autoComplete="name"
              />
            </Field>

            <Field label="Email">
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="user@example.com"
                autoComplete="email"
              />
            </Field>

            <Field label="Phone Number">
              <input
                className={inputClass}
                value={form.phoneNumber}
                onChange={(event) => updateField('phoneNumber', event.target.value)}
                placeholder="98xxxxxxxx"
                autoComplete="tel"
              />
            </Field>

            <Field label="Password">
              <input
                className={inputClass}
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
              />
            </Field>

            <Field label="User Type">
              <select
                className={inputClass}
                value={form.userType}
                onChange={(event) => updateField('userType', event.target.value)}
              >
                {userTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="md:col-span-2">
              <Button type="submit" isLoading={saving}>
                Create User
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default ManualUserRegistrationPage;
