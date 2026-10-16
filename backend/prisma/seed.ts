import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

function generatePassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'NV-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function main() {
  console.log('🌱 Starting Nivasa seed...\n');

  // ============================================================
  // Clean up existing seed data (idempotent)
  // ============================================================
  console.log('Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.amenityBooking.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.complaintComment.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.paymentReceipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.maintenanceBill.deleteMany();
  await prisma.visitorApproval.deleteMany();
  await prisma.visitorEntryLog.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.residentProfile.deleteMany();
  await prisma.apartment.deleteMany();
  await prisma.society.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleanup complete\n');

  // ============================================================
  // Society
  // ============================================================
  const society = await prisma.society.create({
    data: {
      name: 'Nivasa Residency',
      address: '45, Palm Avenue, Sector 12',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      phone: '+91-80-4567-8900',
      email: 'admin@nivasaresidency.com',
      description: 'A premium residential society with world-class amenities in the heart of Bangalore.',
    },
  });
  console.log(`✅ Society: ${society.name}`);

  // ============================================================
  // Users — Admin
  // ============================================================
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@nivasa.com',
      passwordHash: await hashPassword('Admin@123'),
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91-9876543210',
      role: 'ADMIN',
    },
  });

  const adminUser2 = await prisma.user.create({
    data: {
      email: 'manager@nivasa.com',
      passwordHash: await hashPassword('Manager@123'),
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+91-9876543211',
      role: 'ADMIN',
    },
  });

  // Security Staff
  const securityUser = await prisma.user.create({
    data: {
      email: 'security@nivasa.com',
      passwordHash: await hashPassword('Security@123'),
      firstName: 'Ravi',
      lastName: 'Verma',
      phone: '+91-9876543212',
      role: 'SECURITY',
    },
  });

  const securityUser2 = await prisma.user.create({
    data: {
      email: 'guard2@nivasa.com',
      passwordHash: await hashPassword('Guard@123'),
      firstName: 'Suresh',
      lastName: 'Patil',
      phone: '+91-9876543213',
      role: 'SECURITY',
    },
  });

  console.log(`✅ Admin users: ${adminUser.email}, ${adminUser2.email}`);
  console.log(`✅ Security staff: ${securityUser.email}, ${securityUser2.email}`);

  // ============================================================
  // Apartments
  // ============================================================
  const apartments = [];
  const buildings = ['Tower A', 'Tower B', 'Tower C'];
  const types = ['1BHK', '2BHK', '3BHK', '4BHK'];
  const maintenanceAmounts: Record<string, number> = {
    '1BHK': 2000,
    '2BHK': 2500,
    '3BHK': 3500,
    '4BHK': 5000,
  };

  for (const building of buildings) {
    for (let floor = 1; floor <= 5; floor++) {
      for (let unit = 1; unit <= 4; unit++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const unitNumber = `${floor}0${unit}`;
        const apt = await prisma.apartment.create({
          data: {
            societyId: society.id,
            building,
            floor,
            unitNumber,
            type,
            areaSqFt: type === '1BHK' ? 650 : type === '2BHK' ? 950 : type === '3BHK' ? 1350 : 1800,
            maintenanceAmt: maintenanceAmounts[type],
            occupancyStatus: 'VACANT',
          },
        });
        apartments.push(apt);
      }
    }
  }
  console.log(`✅ ${apartments.length} apartments created`);

  // ============================================================
  // Resident Users and Profiles
  // ============================================================
  const residentData = [
    { firstName: 'Ananya', lastName: 'Patel', email: 'resident@nivasa.com', phone: '+91-9800000001', aptIdx: 0 },
    { firstName: 'Vikram', lastName: 'Singh', email: 'vikram.singh@email.com', phone: '+91-9800000002', aptIdx: 1 },
    { firstName: 'Meera', lastName: 'Nair', email: 'meera.nair@email.com', phone: '+91-9800000003', aptIdx: 2 },
    { firstName: 'Arjun', lastName: 'Reddy', email: 'arjun.reddy@email.com', phone: '+91-9800000004', aptIdx: 3 },
    { firstName: 'Kavitha', lastName: 'Iyer', email: 'kavitha.iyer@email.com', phone: '+91-9800000005', aptIdx: 4 },
    { firstName: 'Rahul', lastName: 'Gupta', email: 'rahul.gupta@email.com', phone: '+91-9800000006', aptIdx: 5 },
    { firstName: 'Sunita', lastName: 'Joshi', email: 'sunita.joshi@email.com', phone: '+91-9800000007', aptIdx: 6 },
    { firstName: 'Deepak', lastName: 'Mehta', email: 'deepak.mehta@email.com', phone: '+91-9800000008', aptIdx: 7 },
    { firstName: 'Pooja', lastName: 'Sharma', email: 'pooja.sharma@email.com', phone: '+91-9800000009', aptIdx: 8 },
    { firstName: 'Kiran', lastName: 'Das', email: 'kiran.das@email.com', phone: '+91-9800000010', aptIdx: 9 },
  ];

  const residentProfiles = [];
  const residentUsers = [];

  for (let i = 0; i < residentData.length; i++) {
    const rd = residentData[i];
    const user = await prisma.user.create({
      data: {
        email: rd.email,
        passwordHash: await hashPassword(i === 0 ? 'Resident@123' : 'Pass@1234'),
        firstName: rd.firstName,
        lastName: rd.lastName,
        phone: rd.phone,
        role: 'RESIDENT',
      },
    });
    residentUsers.push(user);

    const apt = apartments[rd.aptIdx];
    const profile = await prisma.residentProfile.create({
      data: {
        userId: user.id,
        apartmentId: apt.id,
        residentType: i % 3 === 0 ? 'TENANT' : 'OWNER',
        moveInDate: new Date(`2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-01`),
        emergencyContact: `Emergency ${rd.firstName}`,
        emergencyPhone: '+91-9999999999',
      },
    });
    residentProfiles.push(profile);

    // Update apartment occupancy
    await prisma.apartment.update({
      where: { id: apt.id },
      data: { occupancyStatus: 'OCCUPIED' },
    });
  }
  console.log(`✅ ${residentProfiles.length} residents created`);

  // ============================================================
  // Family Members
  // ============================================================
  await prisma.familyMember.createMany({
    data: [
      { residentProfileId: residentProfiles[0].id, firstName: 'Rohan', lastName: 'Patel', relation: 'Spouse', age: 32, phone: '+91-9800001001' },
      { residentProfileId: residentProfiles[0].id, firstName: 'Anika', lastName: 'Patel', relation: 'Daughter', age: 7 },
      { residentProfileId: residentProfiles[1].id, firstName: 'Priya', lastName: 'Singh', relation: 'Spouse', age: 38 },
      { residentProfileId: residentProfiles[1].id, firstName: 'Aditya', lastName: 'Singh', relation: 'Son', age: 12 },
      { residentProfileId: residentProfiles[2].id, firstName: 'Suresh', lastName: 'Nair', relation: 'Spouse', age: 45 },
      { residentProfileId: residentProfiles[3].id, firstName: 'Lakshmi', lastName: 'Reddy', relation: 'Mother', age: 65, isEmergencyContact: true, phone: '+91-9800001004' },
    ],
  });

  // ============================================================
  // Vehicles
  // ============================================================
  await prisma.vehicle.createMany({
    data: [
      { residentProfileId: residentProfiles[0].id, registrationNo: 'KA01AB1234', make: 'Maruti', model: 'Swift', color: 'Silver', type: 'CAR', parkingSlot: 'A-01' },
      { residentProfileId: residentProfiles[0].id, registrationNo: 'KA01CD5678', make: 'Honda', model: 'Activa', color: 'Blue', type: 'MOTORCYCLE', parkingSlot: 'A-02' },
      { residentProfileId: residentProfiles[1].id, registrationNo: 'KA01EF9012', make: 'Toyota', model: 'Innova', color: 'White', type: 'CAR', parkingSlot: 'B-01' },
      { residentProfileId: residentProfiles[2].id, registrationNo: 'KA02GH3456', make: 'Hyundai', model: 'Creta', color: 'Red', type: 'CAR', parkingSlot: 'B-02' },
      { residentProfileId: residentProfiles[3].id, registrationNo: 'KA03IJ7890', make: 'Tata', model: 'Nexon', color: 'Blue', type: 'CAR', parkingSlot: 'C-01' },
    ],
  });
  console.log(`✅ Family members and vehicles seeded`);

  // ============================================================
  // Visitors
  // ============================================================
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const visitor1 = await prisma.visitor.create({
    data: {
      apartmentId: apartments[0].id,
      residentProfileId: residentProfiles[0].id,
      visitorName: 'Rahul Sharma',
      visitorPhone: '+91-9700001001',
      purpose: 'Personal visit - family friend',
      visitorType: 'GUEST',
      expectedDate: tomorrow,
      expectedTime: '14:00',
      validUntil: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000),
      status: 'PENDING',
      passCode: 'NV-GUEST1',
    },
  });

  const visitor2 = await prisma.visitor.create({
    data: {
      apartmentId: apartments[0].id,
      residentProfileId: residentProfiles[0].id,
      visitorName: 'Amazon Delivery',
      visitorPhone: '+91-9700001002',
      purpose: 'Package delivery',
      visitorType: 'DELIVERY',
      expectedDate: now,
      expectedTime: '10:00',
      status: 'APPROVED',
      passCode: 'NV-DLVR2',
    },
  });

  await prisma.visitorApproval.create({
    data: {
      visitorId: visitor2.id,
      approvedBy: residentUsers[0].id,
      decision: 'APPROVED',
      expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
    },
  });

  const visitor3 = await prisma.visitor.create({
    data: {
      apartmentId: apartments[1].id,
      residentProfileId: residentProfiles[1].id,
      visitorName: 'Manoj Electrician',
      visitorPhone: '+91-9700001003',
      purpose: 'AC service and maintenance',
      visitorType: 'SERVICE',
      expectedDate: yesterday,
      status: 'CHECKED_IN',
      passCode: 'NV-SRVC3',
    },
  });

  await prisma.visitorApproval.create({
    data: {
      visitorId: visitor3.id,
      approvedBy: residentUsers[1].id,
      decision: 'APPROVED',
    },
  });

  await prisma.visitorEntryLog.create({
    data: {
      visitorId: visitor3.id,
      recordedBy: securityUser.id,
      checkInAt: new Date(yesterday.getTime() + 9 * 60 * 60 * 1000),
    },
  });

  const visitor4 = await prisma.visitor.create({
    data: {
      apartmentId: apartments[2].id,
      residentProfileId: residentProfiles[2].id,
      visitorName: 'Sunita Sharma',
      visitorPhone: '+91-9700001004',
      purpose: 'Birthday party guest',
      visitorType: 'GUEST',
      expectedDate: yesterday,
      status: 'CHECKED_OUT',
      passCode: 'NV-CHKO4',
    },
  });

  await prisma.visitorApproval.create({
    data: {
      visitorId: visitor4.id,
      approvedBy: residentUsers[2].id,
      decision: 'APPROVED',
    },
  });

  await prisma.visitorEntryLog.create({
    data: {
      visitorId: visitor4.id,
      recordedBy: securityUser.id,
      checkInAt: new Date(yesterday.getTime() + 17 * 60 * 60 * 1000),
      checkOutAt: new Date(yesterday.getTime() + 21 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ Visitors seeded`);

  // ============================================================
  // Maintenance Bills
  // ============================================================
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // Generate bills for occupied apartments
  const occupiedApts = apartments.slice(0, 10);
  const bills = [];

  for (const apt of occupiedApts) {
    // Previous month bill
    const prevBill = await prisma.maintenanceBill.create({
      data: {
        apartmentId: apt.id,
        billingMonth: prevMonth,
        billingYear: prevYear,
        amount: apt.maintenanceAmt,
        dueDate: new Date(`${prevYear}-${String(prevMonth).padStart(2, '0')}-15`),
        status: 'PAID',
        paidAmount: apt.maintenanceAmt,
        generatedBy: adminUser.id,
      },
    });

    // Create payment and receipt for previous month
    const payment = await prisma.payment.create({
      data: {
        billId: prevBill.id,
        amount: apt.maintenanceAmt,
        paymentMethod: 'DEMO_PAYMENT',
        paymentStatus: 'COMPLETED',
        referenceNumber: `DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        isDemo: true,
        paidAt: new Date(prevYear, prevMonth - 1, 10),
      },
    });

    await prisma.paymentReceipt.create({
      data: {
        paymentId: payment.id,
        receiptNo: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        receiptData: {
          isDemo: true,
          amount: Number(apt.maintenanceAmt),
          billingMonth: prevMonth,
          billingYear: prevYear,
          demoDisclaimer: 'THIS IS A SIMULATED DEMO PAYMENT. No actual money was transferred.',
        },
      },
    });

    // Current month bill
    const currentBill = await prisma.maintenanceBill.create({
      data: {
        apartmentId: apt.id,
        billingMonth: currentMonth,
        billingYear: currentYear,
        amount: apt.maintenanceAmt,
        dueDate: new Date(`${currentYear}-${String(currentMonth).padStart(2, '0')}-15`),
        status: apt.id === apartments[0].id ? 'PAID' : apt.id === apartments[1].id ? 'PARTIALLY_PAID' : 'UNPAID',
        paidAmount: apt.id === apartments[0].id ? apt.maintenanceAmt : apt.id === apartments[1].id ? 1000 : 0,
        generatedBy: adminUser.id,
      },
    });

    bills.push({ prevBill, currentBill });
  }
  console.log(`✅ Maintenance bills seeded`);

  // ============================================================
  // Complaints
  // ============================================================
  const complaints = [
    {
      residentProfileId: residentProfiles[0].id,
      title: 'Lift frequently breaking down',
      description: 'The elevator in Tower A has been malfunctioning for the past week. It gets stuck between floors and has caused multiple incidents.',
      category: 'Lift/Elevator',
      priority: 'HIGH' as const,
      status: 'IN_PROGRESS' as const,
      assignedTo: adminUser2.id,
    },
    {
      residentProfileId: residentProfiles[1].id,
      title: 'Water leakage in bathroom ceiling',
      description: 'There is significant water dripping from the ceiling of my master bathroom. The floor above seems to be leaking.',
      category: 'Plumbing',
      priority: 'URGENT' as const,
      status: 'ASSIGNED' as const,
      assignedTo: adminUser2.id,
    },
    {
      residentProfileId: residentProfiles[2].id,
      title: 'Parking spot occupied by unknown vehicle',
      description: 'My designated parking spot B-02 has been occupied by an unregistered vehicle for 3 days.',
      category: 'Parking',
      priority: 'MEDIUM' as const,
      status: 'SUBMITTED' as const,
    },
    {
      residentProfileId: residentProfiles[3].id,
      title: 'Gym equipment needs maintenance',
      description: 'The treadmill in the gym has been broken for 2 weeks. Please arrange for repair.',
      category: 'Amenities',
      priority: 'LOW' as const,
      status: 'RESOLVED' as const,
      resolvedAt: new Date(),
      resolutionNotes: 'Treadmill repaired by vendor on 05-Oct. All equipment tested and functional.',
    },
    {
      residentProfileId: residentProfiles[0].id,
      title: 'Noisy neighbors disturbing late at night',
      description: 'The residents in apartment 203 regularly have loud parties past midnight on weekdays.',
      category: 'Noise Complaint',
      priority: 'MEDIUM' as const,
      status: 'CLOSED' as const,
      resolvedAt: yesterday,
      resolutionNotes: 'Issue raised with concerned residents. Warning issued.',
    },
  ];

  for (const complaint of complaints) {
    const created = await prisma.complaint.create({ data: complaint as any });

    if (complaint.status === 'IN_PROGRESS') {
      await prisma.complaintComment.create({
        data: {
          complaintId: created.id,
          userId: adminUser2.id,
          comment: 'We have contacted the elevator maintenance company. Technician will visit on Monday.',
          isInternal: false,
        },
      });
    }
  }
  console.log(`✅ ${complaints.length} complaints seeded`);

  // ============================================================
  // Amenities
  // ============================================================
  const amenities = [
    { name: 'Clubhouse', description: 'Fully equipped clubhouse for events and gatherings', location: 'Ground Floor, Block A', capacity: 100, openingTime: '08:00', closingTime: '22:00', slotDuration: 120, requiresApproval: true },
    { name: 'Swimming Pool', description: 'Olympic-size swimming pool with changing rooms', location: 'Podium Level', capacity: 30, openingTime: '06:00', closingTime: '21:00', slotDuration: 60, requiresApproval: false },
    { name: 'Gym', description: 'State-of-the-art fitness center', location: 'Ground Floor, Block B', capacity: 20, openingTime: '05:30', closingTime: '22:30', slotDuration: 60, requiresApproval: false },
    { name: 'Badminton Court', description: 'Indoor badminton court with professional flooring', location: 'Sports Complex', capacity: 4, openingTime: '06:00', closingTime: '21:00', slotDuration: 60, requiresApproval: false },
    { name: 'Community Hall', description: 'Large event hall with catering facility', location: 'Podium, East Wing', capacity: 200, openingTime: '09:00', closingTime: '22:00', slotDuration: 240, requiresApproval: true },
    { name: 'Terrace Garden', description: 'Beautiful landscaped terrace for relaxation', location: 'Top Floor', capacity: 50, openingTime: '06:00', closingTime: '21:00', slotDuration: 60, requiresApproval: false },
  ];

  const createdAmenities = [];
  for (const amenity of amenities) {
    const created = await prisma.amenity.create({
      data: { ...amenity, societyId: society.id },
    });
    createdAmenities.push(created);
  }
  console.log(`✅ ${amenities.length} amenities seeded`);

  // ============================================================
  // Amenity Bookings
  // ============================================================
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextWeek = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  await prisma.amenityBooking.createMany({
    data: [
      {
        amenityId: createdAmenities[1].id, // Pool
        bookedBy: residentUsers[0].id,
        date: todayDate,
        startTime: '07:00',
        endTime: '08:00',
        purpose: 'Morning swim',
        status: 'CONFIRMED',
      },
      {
        amenityId: createdAmenities[2].id, // Gym
        bookedBy: residentUsers[1].id,
        date: todayDate,
        startTime: '06:00',
        endTime: '07:00',
        purpose: 'Morning workout',
        status: 'CONFIRMED',
      },
      {
        amenityId: createdAmenities[0].id, // Clubhouse
        bookedBy: residentUsers[2].id,
        date: nextWeek,
        startTime: '18:00',
        endTime: '20:00',
        purpose: 'Birthday party',
        status: 'PENDING',
        approvedBy: null,
      },
      {
        amenityId: createdAmenities[3].id, // Badminton
        bookedBy: residentUsers[3].id,
        date: todayDate,
        startTime: '19:00',
        endTime: '20:00',
        purpose: 'Evening game',
        status: 'CONFIRMED',
      },
      {
        amenityId: createdAmenities[1].id, // Pool - cancelled
        bookedBy: residentUsers[4].id,
        date: yesterday,
        startTime: '08:00',
        endTime: '09:00',
        purpose: 'Swimming practice',
        status: 'CANCELLED',
        cancelledBy: residentUsers[4].id,
        cancelReason: 'Personal emergency',
      },
    ],
  });
  console.log(`✅ Bookings seeded`);

  // ============================================================
  // Announcements
  // ============================================================
  await prisma.announcement.createMany({
    data: [
      {
        societyId: society.id,
        createdBy: adminUser.id,
        title: 'Annual Society Meeting — November 15, 2026',
        content: 'Dear Residents,\n\nYou are cordially invited to attend the Annual General Body Meeting of Nivasa Residency on November 15, 2026 at 6:00 PM in the Community Hall.\n\nAgenda:\n1. Review of financial statements\n2. Maintenance fee revision\n3. Infrastructure improvements\n4. Election of new committee members\n\nYour presence is important. Please RSVP by November 10.',
        category: 'GENERAL',
        status: 'PUBLISHED',
        publishedAt: now,
        isPinned: true,
      },
      {
        societyId: society.id,
        createdBy: adminUser.id,
        title: 'Water Tank Cleaning — November 20, 2026',
        content: 'Water supply will be interrupted on November 20, 2026 from 9:00 AM to 2:00 PM for annual water tank cleaning and maintenance. Please store sufficient water in advance.\n\nWe apologize for the inconvenience.',
        category: 'MAINTENANCE',
        status: 'PUBLISHED',
        publishedAt: now,
      },
      {
        societyId: society.id,
        createdBy: adminUser.id,
        title: 'Diwali Celebrations — Society Event',
        content: 'Join us for a grand Diwali celebration on October 30, 2026 from 6:00 PM at the Terrace Garden. There will be rangoli competition, lighting ceremony, cultural performances, and a community dinner. Children\'s events start at 5:00 PM.',
        category: 'EVENT',
        status: 'PUBLISHED',
        publishedAt: yesterday,
      },
      {
        societyId: society.id,
        createdBy: adminUser.id,
        title: 'New Security Protocol for Visitors',
        content: 'Starting November 1, 2026, all visitors must be pre-registered through the Nivasa app or website at least 2 hours before arrival. Walk-in visitors will need resident confirmation via phone before entry.',
        category: 'SECURITY',
        status: 'PUBLISHED',
        publishedAt: yesterday,
      },
      {
        societyId: society.id,
        createdBy: adminUser.id,
        title: 'Gym Equipment Upgrade — Draft',
        content: 'Planning to upgrade gym equipment in Q1 2027. Pending budget approval.',
        category: 'MAINTENANCE',
        status: 'DRAFT',
      },
    ],
  });
  console.log(`✅ Announcements seeded`);

  // ============================================================
  // Notifications
  // ============================================================
  await prisma.notification.createMany({
    data: [
      {
        userId: residentUsers[0].id,
        type: 'MAINTENANCE_BILL',
        title: 'Maintenance Bill for October 2026',
        message: 'Your maintenance bill for October 2026 has been generated. Amount: ₹2,500. Due date: October 15, 2026.',
        isRead: false,
      },
      {
        userId: residentUsers[0].id,
        type: 'VISITOR_REQUEST',
        title: 'Visitor Request Pending',
        message: 'Rahul Sharma has requested to visit tomorrow. Please approve or reject.',
        isRead: false,
      },
      {
        userId: residentUsers[0].id,
        type: 'ANNOUNCEMENT',
        title: 'New Announcement: Annual Society Meeting',
        message: 'Annual General Body Meeting scheduled for November 15, 2026 at 6:00 PM in Community Hall.',
        isRead: true,
        readAt: yesterday,
      },
      {
        userId: residentUsers[1].id,
        type: 'COMPLAINT_UPDATE',
        title: 'Complaint Update',
        message: 'Your complaint "Water leakage in bathroom ceiling" has been assigned to maintenance team.',
        isRead: false,
      },
      {
        userId: residentUsers[2].id,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Pending Approval',
        message: 'Your booking for Clubhouse on next week is pending admin approval.',
        isRead: false,
      },
    ],
  });
  console.log(`✅ Notifications seeded`);

  // ============================================================
  // Audit Logs
  // ============================================================
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: residentUsers[0].id,
        details: { email: residentUsers[0].email, role: 'RESIDENT' },
      },
      {
        actorId: adminUser.id,
        action: 'BILL_GENERATED',
        entityType: 'MaintenanceBill',
        details: { billingMonth: currentMonth, billingYear: currentYear, created: 10 },
      },
      {
        actorId: residentUsers[0].id,
        action: 'VISITOR_APPROVED',
        entityType: 'Visitor',
        entityId: visitor2.id,
      },
      {
        actorId: securityUser.id,
        action: 'VISITOR_CHECKIN',
        entityType: 'Visitor',
        entityId: visitor3.id,
      },
    ],
  });

  console.log('\n✅ Seed completed successfully!\n');
  console.log('='.repeat(60));
  console.log('DEMO ACCOUNTS');
  console.log('='.repeat(60));
  console.log('\n🔑 Administrator:');
  console.log('   Email: admin@nivasa.com');
  console.log('   Password: Admin@123');
  console.log('\n🏠 Resident (Primary Demo):');
  console.log('   Email: resident@nivasa.com');
  console.log('   Password: Resident@123');
  console.log('\n🛡️  Security Staff:');
  console.log('   Email: security@nivasa.com');
  console.log('   Password: Security@123');
  console.log('\n📝 Additional accounts password: Pass@1234 / Guard@123');
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
