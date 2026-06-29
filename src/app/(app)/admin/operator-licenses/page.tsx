'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TopAppBar } from '@/components/shared/top-app-bar'
import {
  Award,
  HeartPulse,
  Clock,
  Search,
  Plus,
  CheckCircle,
  Settings,
  ShieldAlert,
  GraduationCap,
} from 'lucide-react'

interface Operator {
  id: string
  name: string
  employeeCode: string
  licenseTier: 'base_3' | 'base_2' | 'base_1' | 'senior'
  medicalStatus: 'approved' | 'pending_exam' | 'expired'
  medicalExpiry: string
  simulatorScore: number // out of 100
  lastSimulatorTest: string
  licenseExpiry: string
  safetyScore: number // out of 100
}

const INITIAL_OPERATORS: Operator[] = [
  { id: '1', name: 'حمیدرضا رضایی', employeeCode: '10203', licenseTier: 'senior', medicalStatus: 'approved', medicalExpiry: '۱۴۰۶/۰۵/۱۲', simulatorScore: 92, lastSimulatorTest: '۱۴۰۵/۰۲/۱۰', licenseExpiry: '۱۴۰۷/۰۸/۱۹', safetyScore: 98 },
  { id: '2', name: 'امیر قاسمی', employeeCode: '10355', licenseTier: 'base_1', medicalStatus: 'approved', medicalExpiry: '۱۴۰۶/۰۲/۲۰', simulatorScore: 88, lastSimulatorTest: '۱۴۰۵/۰۱/۱۵', licenseExpiry: '۱۴۰۶/۱۲/۰۵', safetyScore: 95 },
  { id: '3', name: 'مرتضی کریمی', employeeCode: '10582', licenseTier: 'base_2', medicalStatus: 'expired', medicalExpiry: '۱۴۰۵/۰۳/۰۱', simulatorScore: 78, lastSimulatorTest: '۱۴۰۴/۱۲/۲۰', licenseExpiry: '۱۴۰۶/۰۴/۱۵', safetyScore: 82 },
  { id: '4', name: 'جواد هاشمی', employeeCode: '10744', licenseTier: 'base_3', medicalStatus: 'approved', medicalExpiry: '۱۴۰۶/۰۹/۰۱', simulatorScore: 85, lastSimulatorTest: '۱۴۰۵/۰۳/۰۵', licenseExpiry: '۱۴۰۷/۰۳/۰۱', safetyScore: 90 },
  { id: '5', name: 'رضا ملکی', employeeCode: '11090', licenseTier: 'base_1', medicalStatus: 'pending_exam', medicalExpiry: '۱۴۰۵/۰۴/۳۰', simulatorScore: 81, lastSimulatorTest: '۱۴۰۴/۱۱/۱۵', licenseExpiry: '۱۴۰۶/۰۲/۲۰', safetyScore: 87 },
]

const TIER_LABELS: Record<Operator['licenseTier'], string> = {
  base_3: 'راهبر پایه ۳ (لوکوموتیو مانوری)',
  base_2: 'راهبر پایه ۲ (مسافربری خط فرعی)',
  base_1: 'راهبر پایه ۱ (مسافربری خط اصلی)',
  senior: 'راهبر ارشد (مدرس و راهنمای خط ۱)',
}

export default function OperatorLicensesPage() {
  const [operators, setOperators] = useState<Operator[]>(INITIAL_OPERATORS)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [filterMedical, setFilterMedical] = useState<string>('all')

  // فرم ثبت گواهی جدید
  const [showAddForm, setShowAddForm] = useState(false)
  const [opName, setOpName] = useState('')
  const [opCode, setOpCode] = useState('')
  const [opTier, setOpTier] = useState<Operator['licenseTier']>('base_3')
  const [opMedStatus, setOpMedStatus] = useState<Operator['medicalStatus']>('approved')
  const [opMedExpiry, setOpMedExpiry] = useState('۱۴۰۶/۱۲/۲۹')
  const [opSimScore, setOpSimScore] = useState(85)
  const [opSimDate, setOpSimDate] = useState('۱۴۰۵/۰۳/۲۰')
  const [opLicExpiry, setOpLicExpiry] = useState('۱۴۰۷/۱۲/۲۹')
  const [opSafety, setOpSafety] = useState(90)

  // تنظیمات حد آستانه سازمان (قانون ۷)
  const [minPassingSimScore, setMinPassingSimScore] = useState(80)
  const [medicalValidityMonths, setMedicalValidityMonths] = useState(12)
  const [safetyAlertThreshold, setSafetyAlertThreshold] = useState(85)
  const [successMessage, setSuccessMessage] = useState('')

  const handleAddOperator = (e: React.FormEvent) => {
    e.preventDefault()
    if (!opName || !opCode) {
      alert('لطفاً نام و کد پرسنلی راهبر را وارد کنید.')
      return
    }

    const newOperator: Operator = {
      id: `OP-${operators.length + 1}`,
      name: opName,
      employeeCode: opCode,
      licenseTier: opTier,
      medicalStatus: opMedStatus,
      medicalExpiry: opMedExpiry,
      simulatorScore: opSimScore,
      lastSimulatorTest: opSimDate,
      licenseExpiry: opLicExpiry,
      safetyScore: opSafety,
    }

    setOperators((prev) => [newOperator, ...prev])
    setShowAddForm(false)
    resetForm()
    setSuccessMessage('اطلاعات صلاحیت و پرونده راهبر جدید با موفقیت ثبت شد.')
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  const resetForm = () => {
    setOpName('')
    setOpCode('')
    setOpTier('base_3')
    setOpMedStatus('approved')
    setOpSimScore(85)
    setOpSafety(90)
  }

  const handleUpdateSimulatorScore = (id: string, score: number) => {
    setOperators((prev) =>
      prev.map((op) => {
        if (op.id === id) {
          const nextScore = Math.min(100, Math.max(0, score))
          return {
            ...op,
            simulatorScore: nextScore,
            lastSimulatorTest: 'هم‌اکنون (ثبت دستی)',
          }
        }
        return op
      }),
    )
  }

  const filteredOperators = operators.filter((op) => {
    const matchesSearch = op.name.includes(searchTerm) || op.employeeCode.includes(searchTerm)
    const matchesTier = filterTier === 'all' || op.licenseTier === filterTier
    const matchesMedical = filterMedical === 'all' || op.medicalStatus === filterMedical
    return matchesSearch && matchesTier && matchesMedical
  })

  // هشدارهای انقضا یا افت امتیاز
  const expiredMedicalsCount = operators.filter((o) => o.medicalStatus === 'expired').length
  const lowSafetyCount = operators.filter((o) => o.safetyScore < safetyAlertThreshold).length
  const lowSimulatorCount = operators.filter((o) => o.simulatorScore < minPassingSimScore).length

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <TopAppBar
        title="صلاحیت فنی و گواهی راهبران خط ۱"
        subtitle="پیگیری و کنترل مدارک، سلامت شغلی و نتایج شبیه‌ساز لکوموتیو رانان"
      />

      <main className="flex-1 p-4 pt-16 md:p-6 space-y-6">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
            <CheckCircle className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Widgets / Alarm Indicators */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="bg-surface-container-low border-border-subtle">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">معاینات طب کار منقضی‌شده</p>
                <h3 className={`text-lg font-bold mt-1 ${expiredMedicalsCount > 0 ? 'text-critical' : 'text-success'}`}>
                  {expiredMedicalsCount} مورد نیازمند معاینه فوری
                </h3>
              </div>
              <div className={`p-2.5 rounded-lg ${expiredMedicalsCount > 0 ? 'bg-critical/10 text-critical' : 'bg-success/15 text-success'}`}>
                <HeartPulse className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-container-low border-border-subtle">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">مردودی در شبیه‌ساز (زیر {minPassingSimScore} امتیاز)</p>
                <h3 className={`text-lg font-bold mt-1 ${lowSimulatorCount > 0 ? 'text-warning' : 'text-success'}`}>
                  {lowSimulatorCount} راهبر نیازمند تکرار آزمون
                </h3>
              </div>
              <div className={`p-2.5 rounded-lg ${lowSimulatorCount > 0 ? 'bg-warning/10 text-warning' : 'bg-success/15 text-success'}`}>
                <GraduationCap className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-container-low border-border-subtle">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">امتیاز ایمنی بحرانی (پایین‌تر از {safetyAlertThreshold})</p>
                <h3 className={`text-lg font-bold mt-1 ${lowSafetyCount > 0 ? 'text-critical' : 'text-success'}`}>
                  {lowSafetyCount} هشدار ایمنی رانندگی
                </h3>
              </div>
              <div className={`p-2.5 rounded-lg ${lowSafetyCount > 0 ? 'bg-critical/10 text-critical' : 'bg-success/15 text-success'}`}>
                <ShieldAlert className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Operators List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border-subtle bg-surface-container-low">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border-subtle">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Award className="size-4 text-accent" />
                  پرونده فنی و گواهینامه راهبران خط ۱ مترو
                </CardTitle>
                <Button size="sm" className="h-8 gap-1" onClick={() => setShowAddForm(!showAddForm)}>
                  <Plus className="size-4" />
                  <span>ثبت راهبر یا مدرک جدید</span>
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Search & Filters */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-2.5 size-4 text-foreground-muted" />
                    <input
                      type="text"
                      placeholder="جستجو بر اساس نام راهبر یا کد پرسنلی..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-md border border-border bg-surface pr-9 pl-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={filterTier}
                      onChange={(e) => setFilterTier(e.target.value)}
                      className="rounded-md border border-border bg-surface px-2.5 py-2 text-xs"
                    >
                      <option value="all">همه رده‌های راهبری</option>
                      <option value="base_3">پایه ۳</option>
                      <option value="base_2">پایه ۲</option>
                      <option value="base_1">پایه ۱</option>
                      <option value="senior">راهبر ارشد</option>
                    </select>

                    <select
                      value={filterMedical}
                      onChange={(e) => setFilterMedical(e.target.value)}
                      className="rounded-md border border-border bg-surface px-2.5 py-2 text-xs"
                    >
                      <option value="all">همه وضعیت‌های طب کار</option>
                      <option value="approved">دارای تاییدیه</option>
                      <option value="pending_exam">در نوبت معاینه</option>
                      <option value="expired">منقضی شده</option>
                    </select>
                  </div>
                </div>

                {/* Add Operator Form (Collapsible) */}
                {showAddForm && (
                  <form onSubmit={handleAddOperator} className="border border-border rounded-lg p-4 bg-surface space-y-4 mb-4">
                    <h4 className="text-xs font-bold text-foreground-muted border-b border-border pb-2">ثبت صلاحیت فنی جدید</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">نام و نام خانوادگی راهبر *</label>
                        <input
                          type="text"
                          required
                          value={opName}
                          onChange={(e) => setOpName(e.target.value)}
                          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">کد پرسنلی *</label>
                        <input
                          type="text"
                          required
                          value={opCode}
                          onChange={(e) => setOpCode(e.target.value)}
                          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">رده گواهینامه راهبری</label>
                        <select
                          value={opTier}
                          onChange={(e) => setOpTier(e.target.value as Operator['licenseTier'])}
                          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                        >
                          <option value="base_3">پایه ۳</option>
                          <option value="base_2">پایه ۲</option>
                          <option value="base_1">پایه ۱</option>
                          <option value="senior">راهبر ارشد</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">وضعیت معاینه طب کار</label>
                        <select
                          value={opMedStatus}
                          onChange={(e) => setOpMedStatus(e.target.value as Operator['medicalStatus'])}
                          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                        >
                          <option value="approved">تایید پزشکی</option>
                          <option value="pending_exam">در انتظار نوبت</option>
                          <option value="expired">منقضی شده</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">انقضای طب کار</label>
                        <input
                          type="text"
                          value={opMedExpiry}
                          onChange={(e) => setOpMedExpiry(e.target.value)}
                          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">امتیاز شبیه‌ساز ( Simulator )</label>
                        <input
                          type="number"
                          value={opSimScore}
                          onChange={(e) => setOpSimScore(Number(e.target.value))}
                          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">تاریخ آخرین تست شبیه‌ساز</label>
                        <input
                          type="text"
                          value={opSimDate}
                          onChange={(e) => setOpSimDate(e.target.value)}
                          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">انقضای گواهینامه راهبری</label>
                        <input
                          type="text"
                          value={opLicExpiry}
                          onChange={(e) => setOpLicExpiry(e.target.value)}
                          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">امتیاز ایمنی سیر (از ۱۰۰)</label>
                        <input
                          type="number"
                          value={opSafety}
                          onChange={(e) => setOpSafety(Number(e.target.value))}
                          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                        انصراف
                      </Button>
                      <Button type="submit" size="sm">
                        ذخیره در پرونده پرسنل
                      </Button>
                    </div>
                  </form>
                )}

                {/* Operators Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle bg-surface-container text-foreground-muted text-xs font-semibold">
                        <th className="p-3">نام و مشخصات راهبر</th>
                        <th className="p-3">رده گواهینامه</th>
                        <th className="p-3">تست شبیه‌ساز لکوموتیو</th>
                        <th className="p-3">سلامت پزشکی (طب کار)</th>
                        <th className="p-3">امتیاز ایمنی سیر</th>
                        <th className="p-3 text-left">اقدامات سریع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle text-sm">
                      {filteredOperators.map((op) => {
                        const isSimFailed = op.simulatorScore < minPassingSimScore
                        const isSafetyLow = op.safetyScore < safetyAlertThreshold

                        return (
                          <tr key={op.id} className="hover:bg-surface-hover">
                            <td className="p-3">
                              <div className="font-semibold text-foreground">{op.name}</div>
                              <div className="text-xs text-foreground-muted mt-0.5">کد پرسنلی: {op.employeeCode}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-xs text-foreground-muted">{TIER_LABELS[op.licenseTier]}</div>
                              <div className="text-[10px] text-foreground-muted/70 font-mono mt-0.5">انقضا: {op.licenseExpiry}</div>
                            </td>
                            <td className="p-3">
                              <div className={`font-mono font-bold ${isSimFailed ? 'text-critical' : 'text-success'}`}>
                                {op.simulatorScore} از ۱۰۰
                                {isSimFailed && <span className="text-[10px] mr-1 text-critical font-medium font-sans">(عدم قبولی)</span>}
                              </div>
                              <div className="text-[10px] text-foreground-muted mt-0.5">تاریخ تست: {op.lastSimulatorTest}</div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className={
                                    op.medicalStatus === 'approved'
                                      ? 'bg-success/15 text-success border-success/30'
                                      : op.medicalStatus === 'expired'
                                      ? 'bg-critical/10 text-critical border-critical/20'
                                      : 'bg-warning/10 text-warning border-warning/20'
                                  }
                                >
                                  {op.medicalStatus === 'approved' ? 'تایید طب کار' : op.medicalStatus === 'expired' ? 'منقضی شده' : 'در نوبت تست'}
                                </Badge>
                              </div>
                              <div className="text-[10px] text-foreground-muted mt-0.5">تاریخ اعتبار: {op.medicalExpiry}</div>
                            </td>
                            <td className="p-3">
                              <div className={`font-mono font-bold ${isSafetyLow ? 'text-critical' : 'text-success'}`}>
                                {op.safetyScore}٪
                              </div>
                              <p className="text-[9px] text-foreground-muted mt-0.5">براساس خطاهای سیگنالینگ</p>
                            </td>
                            <td className="p-3 text-left space-y-1">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[10px] px-2"
                                  onClick={() => handleUpdateSimulatorScore(op.id, op.simulatorScore + 5)}
                                >
                                  ثبت تست شبیه‌ساز جدید
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area: Policy Config */}
          <div className="space-y-6">
            <Card className="border-border-subtle bg-surface-container-low">
              <CardHeader className="border-b border-border-subtle pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Settings className="size-4 text-accent" />
                  قوانین شایستگی و صلاحیت راهبران
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-foreground-muted">حد نصاب قبولی در آزمون شبیه‌ساز ( Simulator )</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minPassingSimScore}
                      onChange={(e) => setMinPassingSimScore(Number(e.target.value))}
                      className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                    />
                    <span className="text-xs text-foreground-muted font-semibold">امتیاز</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-foreground-muted">دوره تناوب تایید سلامت پزشکی (طب کار)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={medicalValidityMonths}
                      onChange={(e) => setMedicalValidityMonths(Number(e.target.value))}
                      className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                    />
                    <span className="text-xs text-foreground-muted font-semibold">ماه</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-foreground-muted">حد آستانه هشدار امتیاز ایمنی راهبری</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={safetyAlertThreshold}
                      onChange={(e) => setSafetyAlertThreshold(Number(e.target.value))}
                      className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                    />
                    <span className="text-xs text-foreground-muted font-semibold">درصد</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSuccessMessage('تنظیمات و استانداردهای صلاحیت راهبران با موفقیت به‌روزرسانی شد.')
                      setTimeout(() => setSuccessMessage(''), 3000)
                    }}
                  >
                    ذخیره قوانین شایستگی
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border-subtle bg-surface-container-low">
              <CardHeader className="border-b border-border-subtle pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-warning" />
                  برنامه زمان‌بندی معاینات گروهی بعدی
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs leading-relaxed">
                <div className="p-2.5 border border-border rounded-md bg-surface">
                  <div className="font-semibold">تست دوره‌ای گروه الف (راهبران اصلی)</div>
                  <div className="text-foreground-muted mt-1">شنبه ۱۴۰۵/۰۴/۱۰ • بیمارستان تخصصی ناجا</div>
                </div>
                <div className="p-2.5 border border-border rounded-md bg-surface">
                  <div className="font-semibold">آزمون کارگاهی و سناریونویسی شبیه‌ساز دپوی صادقیه</div>
                  <div className="text-foreground-muted mt-1">دوشنبه ۱۴۰۵/۰۴/۱۲ • شیفت صبح</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
