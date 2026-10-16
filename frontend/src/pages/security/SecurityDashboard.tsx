import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Key, UserCheck, Users, LogIn, LogOut,
  AlertTriangle, CheckCircle2, Clock, Search, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { StatCard, Loading } from '../../components/ui';
import { StatusBadge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function SecurityDashboard() {
  const [passCodeInput, setPassCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedVisitor, setVerifiedVisitor] = useState<any | null>(null);
  const [verificationMsg, setVerificationMsg] = useState<string | null>(null);
  const [isValidPass, setIsValidPass] = useState(false);

  // Current inside list
  const [currentVisitors, setCurrentVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingCode, setProcessingCode] = useState<string | null>(null);

  const fetchCurrent = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gate/current');
      setCurrentVisitors(res.data.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrent();
  }, []);

  const handleVerifyPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passCodeInput.trim()) return;

    try {
      setVerifying(true);
      setVerifiedVisitor(null);
      setVerificationMsg(null);

      const res = await api.get(`/gate/verify/${passCodeInput.trim().toUpperCase()}`);
      const data = res.data.data;
      setIsValidPass(data.valid);
      setVerifiedVisitor(data.visitor);
      setVerificationMsg(data.message);

      if (data.valid) {
        toast.success('Pass code verified! Ready for check-in.');
      } else {
        toast.error(data.message || 'Invalid or expired pass');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Verification failed');
      setIsValidPass(false);
      setVerificationMsg('Pass code not recognized');
    } finally {
      setVerifying(false);
    }
  };

  const handleCheckIn = async (passCode: string) => {
    try {
      setProcessingCode(passCode);
      await api.post('/gate/checkin', { passCode });
      toast.success('Visitor checked in successfully!');
      setVerifiedVisitor(null);
      setPassCodeInput('');
      fetchCurrent();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to check in');
    } finally {
      setProcessingCode(null);
    }
  };

  const handleCheckOut = async (passCode: string) => {
    try {
      setProcessingCode(passCode);
      await api.post('/gate/checkout', { passCode });
      toast.success('Visitor checked out.');
      fetchCurrent();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to check out');
    } finally {
      setProcessingCode(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge bg-white/20 text-white text-xs mb-1 inline-block">Gate 1 Terminal</span>
          <h1 className="text-2xl font-bold">Main Gate Security Console</h1>
          <p className="text-blue-100 text-xs mt-1">
            Real-time entry verification, boom barrier logging, and visitor safety
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/security/visitors" className="btn bg-white text-blue-900 hover:bg-blue-50 text-xs font-semibold">
            <UserCheck className="w-4 h-4 mr-1.5" /> All Visitor Passes
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Visitors Inside Now"
          value={currentVisitors.length}
          change="Campus occupancy"
          changeType="neutral"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Gate State"
          value="Online"
          change="Terminal active"
          changeType="up"
          icon={<Shield className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Security Protocol"
          value="Standard Pass"
          change="Code verification active"
          changeType="neutral"
          icon={<Key className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50"
        />
      </div>

      {/* Pass Verification Terminal Card */}
      <div className="card border-2 border-brand-200 bg-brand-50/20">
        <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Key className="w-5 h-5 text-brand-600" />
          Pass Code Gate Clearance Scanner
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Ask visitor for their 8-character pass code (e.g. NV-XXXXXX) or enter to verify approval.
        </p>

        <form onSubmit={handleVerifyPass} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ENTER PASS CODE (e.g. NV-AB12CD)..."
              className="input font-mono uppercase text-base tracking-widest pl-4 font-bold"
              value={passCodeInput}
              onChange={(e) => setPassCodeInput(e.target.value.toUpperCase())}
            />
          </div>
          <button
            type="submit"
            disabled={verifying || !passCodeInput}
            className="btn-primary sm:w-40 py-2.5 flex items-center justify-center gap-2"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Code'}
          </button>
        </form>

        {/* Verification Result Preview */}
        {verifiedVisitor && (
          <div className={`mt-4 p-4 rounded-xl border ${isValidPass ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">{verifiedVisitor.visitorName}</h3>
                  <span className={`badge ${isValidPass ? 'badge-success' : 'badge-danger'} text-xs font-bold`}>
                    {verificationMsg || verifiedVisitor.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Destination: <span className="font-bold text-gray-900">Apt {verifiedVisitor.apartment?.building} - {verifiedVisitor.apartment?.unitNumber}</span> • Host: {verifiedVisitor.residentProfile?.user?.firstName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Type: {verifiedVisitor.visitorType} • Vehicle: {verifiedVisitor.vehicleNumber || 'Pedestrian'} • Purpose: {verifiedVisitor.purpose}
                </p>
              </div>

              {isValidPass && (
                <button
                  onClick={() => handleCheckIn(verifiedVisitor.passCode)}
                  disabled={processingCode === verifiedVisitor.passCode}
                  className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 flex items-center justify-center gap-2 self-start sm:self-auto"
                >
                  {processingCode === verifiedVisitor.passCode ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" /> Grant Check-in Entry
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inside Campus Right Now */}
      <div className="card">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Visitors Currently Inside Campus ({currentVisitors.length})
            </h2>
            <p className="text-xs text-gray-500">Live roster of guests checked in through the gate</p>
          </div>
          <button onClick={fetchCurrent} className="text-xs text-brand-600 hover:text-brand-700 font-semibold">
            Refresh &rarr;
          </button>
        </div>

        {loading ? (
          <Loading text="Loading active visitor logs..." />
        ) : currentVisitors.length === 0 ? (
          <p className="text-xs text-gray-400 py-8 text-center italic">
            No outside visitors currently checked inside campus.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {currentVisitors.map((v) => (
              <div key={v.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 text-sm">{v.visitorName}</p>
                    <span className="badge badge-gray text-[10px]">{v.visitorType}</span>
                    <span className="font-mono text-xs text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                      {v.passCode}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    To Apt {v.apartment?.building} - {v.apartment?.unitNumber} • Vehicle: {v.vehicleNumber || 'None'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs text-gray-400">
                    Checked in {v.entryLogs?.[0]?.checkInAt ? new Date(v.entryLogs[0].checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier'}
                  </div>
                  <button
                    onClick={() => handleCheckOut(v.passCode)}
                    disabled={processingCode === v.passCode}
                    className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    {processingCode === v.passCode ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="w-3.5 h-3.5" /> Check Out
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
