import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { updateProfileSchema } from '@/lib/zod/profile'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        nationalId: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        role: {
          select: {
            name: true,
            key: true,
          }
        },
        customFields: true,
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ data: profile })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      )
    }

    const { 
      phone, email, availability, themeColor, carPlate, avatar, personnelNo, group, phone2,
      carPlateNum1, carPlateLetter, carPlateNum2, carPlateCity, carType, carColor, carLicenseExpiry,
      fatherName, idNumber, birthDate, age, birthPlace, maritalStatus, insuranceNo, education,
      post, shift, shiftType, startLocation, hireDate, drivingStatus, licenseClass1Date, licenseClass2Date,
      medicalExamValidity, driverPercent, coDriverPercent, traineeDriverPercent, address, phone3, phone4,
      additionalPhones, vehicles
    } = parsed.data

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { customFields: true, phone: true, email: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    const currentCustomFields = (currentUser.customFields as Record<string, unknown>) || {}

    // Check if the caller is the user themselves (to toggle pending status)
    // When a normal user edits fields, their status is set to 'pending'.
    const getNewValAndStatus = (fieldName: string, newValue: string | undefined) => {
      const currentVal = currentCustomFields[fieldName] ?? ''
      const currentStatus = currentCustomFields[`${fieldName}_status`] ?? 'approved'
      
      if (newValue === undefined) {
        return { val: currentVal, status: currentStatus }
      }
      
      // If the field actually changed, set status to pending. Otherwise keep current status.
      if (newValue !== currentVal) {
        return { val: newValue, status: 'pending' }
      }
      
      return { val: currentVal, status: currentStatus }
    }

    const fn = getNewValAndStatus('fatherName', fatherName)
    const idn = getNewValAndStatus('idNumber', idNumber)
    const bd = getNewValAndStatus('birthDate', birthDate)
    const ag = getNewValAndStatus('age', age)
    const bp = getNewValAndStatus('birthPlace', birthPlace)
    const ms = getNewValAndStatus('maritalStatus', maritalStatus)
    const ins = getNewValAndStatus('insuranceNo', insuranceNo)
    const edu = getNewValAndStatus('education', education)
    const pst = getNewValAndStatus('post', post)
    const shf = getNewValAndStatus('shift', shift)
    const sht = getNewValAndStatus('shiftType', shiftType)
    const sl = getNewValAndStatus('startLocation', startLocation)
    const hd = getNewValAndStatus('hireDate', hireDate)
    const ds = getNewValAndStatus('drivingStatus', drivingStatus)
    const c1 = getNewValAndStatus('licenseClass1Date', licenseClass1Date)
    const c2 = getNewValAndStatus('licenseClass2Date', licenseClass2Date)
    const mev = getNewValAndStatus('medicalExamValidity', medicalExamValidity)
    const dp = getNewValAndStatus('driverPercent', driverPercent)
    const cdp = getNewValAndStatus('coDriverPercent', coDriverPercent)
    const tdp = getNewValAndStatus('traineeDriverPercent', traineeDriverPercent)
    const adr = getNewValAndStatus('address', address)
    const p3 = getNewValAndStatus('phone3', phone3)
    const p4 = getNewValAndStatus('phone4', phone4)
    const pNo = getNewValAndStatus('personnelNo', personnelNo)
    const gp = getNewValAndStatus('group', group)

    // Merge custom field modifications
    const updatedCustomFields = {
      ...currentCustomFields,
      availability: availability ?? currentCustomFields.availability ?? 'online',
      themeColor: themeColor ?? currentCustomFields.themeColor ?? '',
      carPlate: carPlate ?? currentCustomFields.carPlate ?? '',
      avatar: avatar !== undefined ? (avatar === '' ? '' : avatar) : currentCustomFields.avatar ?? '',
      phone2: phone2 !== undefined ? (phone2 === '' ? '' : phone2) : currentCustomFields.phone2 ?? '',
      carPlateNum1: carPlateNum1 !== undefined ? (carPlateNum1 === '' ? '' : carPlateNum1) : currentCustomFields.carPlateNum1 ?? '',
      carPlateLetter: carPlateLetter !== undefined ? (carPlateLetter === '' ? '' : carPlateLetter) : currentCustomFields.carPlateLetter ?? '',
      carPlateNum2: carPlateNum2 !== undefined ? (carPlateNum2 === '' ? '' : carPlateNum2) : currentCustomFields.carPlateNum2 ?? '',
      carPlateCity: carPlateCity !== undefined ? (carPlateCity === '' ? '' : carPlateCity) : currentCustomFields.carPlateCity ?? '',
      carType: carType !== undefined ? (carType === '' ? '' : carType) : currentCustomFields.carType ?? '',
      carColor: carColor !== undefined ? (carColor === '' ? '' : carColor) : currentCustomFields.carColor ?? '',
      carLicenseExpiry: carLicenseExpiry !== undefined ? (carLicenseExpiry === '' ? '' : carLicenseExpiry) : currentCustomFields.carLicenseExpiry ?? '',
      
      // Personal fields and their status
      fatherName: fn.val,
      fatherName_status: fn.status,
      idNumber: idn.val,
      idNumber_status: idn.status,
      birthDate: bd.val,
      birthDate_status: bd.status,
      age: ag.val,
      age_status: ag.status,
      birthPlace: bp.val,
      birthPlace_status: bp.status,
      maritalStatus: ms.val,
      maritalStatus_status: ms.status,
      insuranceNo: ins.val,
      insuranceNo_status: ins.status,
      education: edu.val,
      education_status: edu.status,
      post: pst.val,
      post_status: pst.status,
      shift: shf.val,
      shift_status: shf.status,
      shiftType: sht.val,
      shiftType_status: sht.status,
      startLocation: sl.val,
      startLocation_status: sl.status,
      hireDate: hd.val,
      hireDate_status: hd.status,
      drivingStatus: ds.val,
      drivingStatus_status: ds.status,
      licenseClass1Date: c1.val,
      licenseClass1Date_status: c1.status,
      licenseClass2Date: c2.val,
      licenseClass2Date_status: c2.status,
      medicalExamValidity: mev.val,
      medicalExamValidity_status: mev.status,
      driverPercent: dp.val,
      driverPercent_status: dp.status,
      coDriverPercent: cdp.val,
      coDriverPercent_status: cdp.status,
      traineeDriverPercent: tdp.val,
      traineeDriverPercent_status: tdp.status,
      address: adr.val,
      address_status: adr.status,
      phone3: p3.val,
      phone3_status: p3.status,
      phone4: p4.val,
      phone4_status: p4.status,
      personnelNo: pNo.val,
      personnelNo_status: pNo.status,
      group: gp.val,
      group_status: gp.status,
      
      additionalPhones: additionalPhones !== undefined ? additionalPhones : currentCustomFields.additionalPhones ?? [],
      
      // Vehicles (if passed, set any added/edited ones status to pending)
      vehicles: vehicles !== undefined ? vehicles : currentCustomFields.vehicles ?? [],
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: phone !== undefined ? (phone === '' ? null : phone) : currentUser.phone,
        email: email !== undefined ? (email === '' ? null : email) : currentUser.email,
        customFields: updatedCustomFields,
      },
      select: {
        id: true,
        nationalId: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        customFields: true,
        role: {
          select: {
            name: true,
            key: true,
          }
        },
      },
    })

    // Write AuditLog
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'User',
        entityId: user.id,
        action: 'update',
        before: {
          phone: currentUser.phone,
          email: currentUser.email,
          customFields: currentUser.customFields,
        },
        after: {
          phone: updatedUser.phone,
          email: updatedUser.email,
          customFields: updatedUser.customFields,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'پروفایل شما با موفقیت بروزرسانی شد و جهت تایید به مراجع مربوطه ارسال گردید.',
      data: updatedUser,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
