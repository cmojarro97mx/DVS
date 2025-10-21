import React, { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import { UserIcon } from '../components/icons/UserIcon';
import { CompanyIcon } from '../components/icons/CompanyIcon';
import { EmailIcon } from '../components/icons/EmailIcon';
import { LockIcon } from '../components/icons/LockIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeSlashIcon } from '../components/icons/EyeSlashIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { UserGroupIcon } from '../components/icons/UserGroupIcon';
import { BriefcaseIcon } from '../components/icons/BriefcaseIcon';

interface RegisterPageProps {
  onRegister: () => void;
  onGoToLogin: () => void;
}

const steps = [
  { id: 1, name: 'Your Details' },
  { id: 2, name: 'Company Info' },
  { id: 3, name: 'Finish' },
];

const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <nav aria-label="Progress">
    <ol role="list" className="flex items-center">
      {steps.map((step, stepIdx) => (
        <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
          {currentStep > step.id ? (
            <>
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="h-0.5 w-full bg-red-600" />
              </div>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-red-600">
                <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
            </>
          ) : currentStep === step.id ? (
            <>
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="h-0.5 w-full bg-gray-200" />
              </div>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-600 bg-white" aria-current="step">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600" aria-hidden="true" />
              </div>
            </>
          ) : (
            <>
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="h-0.5 w-full bg-gray-200" />
              </div>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                 <span className="h-2.5 w-2.5 rounded-full bg-transparent" aria-hidden="true" />
              </div>
            </>
          )}
        </li>
      ))}
    </ol>
  </nav>
);


const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onGoToLogin }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    companySize: '',
    industry: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validateStep = () => {
    const newErrors: Partial<typeof formData> = {};
    if (step === 1) {
      if (!formData.name) newErrors.name = 'Full name is required.';
      if (!formData.email) newErrors.email = 'Email is required.';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid.';
      if (!formData.password) newErrors.password = 'Password is required.';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    }
    if (step === 2) {
      if (!formData.company) newErrors.company = 'Company name is required.';
      if (!formData.companySize) newErrors.companySize = 'Company size is required.';
      if (!formData.industry) newErrors.industry = 'Industry is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Final registration data:', formData);
    onRegister();
  };
  
  const renderInput = (id: keyof typeof formData, label: string, type: string, icon: React.ReactNode, placeholder?: string, required = true) => (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <div className="mt-1 relative rounded-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
          <input
            id={id}
            name={id}
            type={type}
            required={required}
            value={formData[id]}
            onChange={handleChange}
            placeholder={placeholder}
            className={`appearance-none block w-full pl-10 pr-4 py-2.5 bg-slate-100/75 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm ${errors[id] ? 'border-red-500 ring-red-500' : 'border-slate-300 focus:ring-red-500'}`}
          />
        </div>
        {errors[id] && <p className="mt-1 text-xs text-red-600">{errors[id]}</p>}
      </div>
  );

  return (
    <AuthLayout>
      <div className="bg-white rounded-xl p-8 sm:p-10 border border-slate-200 shadow-sm w-full">
        <div className="mb-8">
            <Stepper currentStep={step} />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Create Your Admin Account</h1>
                <p className="text-slate-500 mt-1 text-sm">This will be the primary account for your company.</p>
              </div>
              {renderInput('name', 'Full Name', 'text', <UserIcon className="h-5 w-5 text-slate-400" />, 'John Doe')}
              {renderInput('email', 'Email Address', 'email', <EmailIcon className="h-5 w-5 text-slate-400" />, 'you@example.com')}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                <div className="mt-1 relative rounded-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LockIcon className="h-5 w-5 text-slate-400" /></div>
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} className={`appearance-none block w-full pl-10 pr-10 py-2.5 bg-slate-100/75 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm ${errors.password ? 'border-red-500 ring-red-500' : 'border-slate-300 focus:ring-red-500'}`} />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                 {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>
            </>
          )}

          {step === 2 && (
             <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Tell Us About Your Company</h1>
                <p className="text-slate-500 mt-1 text-sm">This helps us tailor your experience.</p>
              </div>
               {renderInput('company', 'Company Name', 'text', <CompanyIcon className="h-5 w-5 text-slate-400" />, 'Global Logistics Inc.')}
               <div>
                  <label htmlFor="companySize" className="block text-sm font-medium text-slate-700">Company Size</label>
                   <div className="mt-1 relative rounded-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserGroupIcon className="h-5 w-5 text-slate-400" /></div>
                        <select id="companySize" name="companySize" value={formData.companySize} onChange={handleChange} required className={`appearance-none block w-full pl-10 pr-4 py-2.5 bg-slate-100/75 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm ${errors.companySize ? 'border-red-500 ring-red-500' : 'border-slate-300 focus:ring-red-500'}`}>
                           <option value="" disabled>Select number of employees</option>
                           <option>1-10 employees</option>
                           <option>11-50 employees</option>
                           <option>51-200 employees</option>
                           <option>201-500 employees</option>
                           <option>500+ employees</option>
                        </select>
                   </div>
                   {errors.companySize && <p className="mt-1 text-xs text-red-600">{errors.companySize}</p>}
               </div>
               <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-slate-700">Industry</label>
                  <div className="mt-1 relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><BriefcaseIcon className="h-5 w-5 text-slate-400" /></div>
                    <select id="industry" name="industry" value={formData.industry} onChange={handleChange} required className={`appearance-none block w-full pl-10 pr-4 py-2.5 bg-slate-100/75 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm ${errors.industry ? 'border-red-500 ring-red-500' : 'border-slate-300 focus:ring-red-500'}`}>
                       <option value="" disabled>Select your industry</option>
                       <option>Freight & Logistics</option>
                       <option>Manufacturing</option>
                       <option>Retail & E-commerce</option>
                       <option>Wholesale</option>
                       <option>Other</option>
                    </select>
                  </div>
                  {errors.industry && <p className="mt-1 text-xs text-red-600">{errors.industry}</p>}
               </div>
            </>
          )}
          
          {step === 3 && (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-800">Registration Complete!</h1>
              <p className="text-slate-500 mt-2">Welcome, {formData.name}. Your account for {formData.company} has been created.</p>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between">
            {step > 1 && step < 3 ? (
                <button type="button" onClick={handleBack} className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">Back</button>
            ) : <div />}
            {step < 3 ? (
                <button type="button" onClick={handleNext} className="w-full md:w-auto md:ml-auto flex justify-center py-3 px-8 border border-transparent rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm">Next Step</button>
            ) : (
                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-sm">Go to Dashboard</button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <button onClick={onGoToLogin} className="font-medium text-red-600 hover:text-red-500 focus:outline-none">
            Sign in
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;