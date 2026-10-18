import { useEffect, useState } from 'react';
import {
  User, Mail, Phone, Home, Calendar, ShieldCheck,
  Key, Lock, CheckCircle, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, Loading } from '../../components/ui';
import toast from 'react-hot-toast';

export default function ResidentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/residents/me');
      setProfile(res.data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setChangingPass(true);
      await api.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update password');
    } finally {
      setChangingPass(false);
    }
  };

  if (loading) return <Loading fullPage text="Loading resident profile..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile & Apartment"
        description="View your registered residency records and security credentials"
      />

      {/* Main Profile Info Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-3xl flex items-center justify-center flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="badge badge-success text-xs font-semibold">
                {profile?.residentType || 'Resident'}
              </span>
              <span className="badge badge-gray text-xs">
                Active Member
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 text-sm">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-500">
              Apartment Allocation
            </h3>
            <div className="flex items-center gap-2.5 text-gray-700">
              <Home className="w-4 h-4 text-emerald-600" />
              <span>Unit {profile?.apartment?.building} - {profile?.apartment?.unitNumber}</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-700">
              <span className="w-4 text-center text-xs text-gray-400">#</span>
              <span>Floor {profile?.apartment?.floor} • Type: {profile?.apartment?.type}</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-700">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>
                Move-in: {profile?.moveInDate ? new Date(profile.moveInDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-500">
              Contact & Emergency
            </h3>
            <div className="flex items-center gap-2.5 text-gray-700">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-700">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{user?.phone || 'No phone registered'}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 text-xs text-gray-600">
              <span className="font-semibold text-gray-800">Emergency SOS: </span>
              {profile?.emergencyContact || 'None listed'} ({profile?.emergencyPhone || 'N/A'})
            </div>
          </div>
        </div>
      </div>

      {/* Security: Change Password */}
      <div className="card">
        <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-600" />
          Update Security Password
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Ensure your account is protected with a strong password.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              required
              className="input text-sm"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="input text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={changingPass}
            className="btn-primary btn-sm"
          >
            {changingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
