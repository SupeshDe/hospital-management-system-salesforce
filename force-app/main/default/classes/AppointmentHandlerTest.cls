@IsTest
private class AppointmentHandlerTest {

    @TestSetup
    static void setupData() {

        Doctor__c doctor = new Doctor__c(
            Name = 'Test Doctor',
            Availability__c = 'Available'
        );

        insert doctor;
    }
    @IsTest
static void testEmergencyPriority() {

    Doctor__c doctor = [
        SELECT Id
        FROM Doctor__c
        LIMIT 1
    ];

    Appointment__c appointment = new Appointment__c(
        Doctor__c = doctor.Id,
        Appointment_Date__c = System.now().addDays(1),
        Type__c = 'Emergency'
    );

    Test.startTest();

    insert appointment;

    Test.stopTest();

    Appointment__c result = [
        SELECT Id, Priority__c
        FROM Appointment__c
        WHERE Id = :appointment.Id
    ];

    System.assertEquals(
        'High',
        result.Priority__c,
        'Emergency appointment should have High priority.'
    );
}
@IsTest
static void testDoctorUnavailable() {

    Doctor__c doctor = [
        SELECT Id, Availability__c
        FROM Doctor__c
        LIMIT 1
    ];

    doctor.Availability__c = 'Not Available';
    update doctor;

    Appointment__c appointment = new Appointment__c(
        Doctor__c = doctor.Id,
        Appointment_Date__c = System.now().addDays(2),
        Type__c = 'Normal'
    );

    Test.startTest();

    Database.SaveResult result = Database.insert(
        appointment,
        false
    );

    Test.stopTest();

    System.assertEquals(
        false,
        result.isSuccess(),
        'Appointment should not be created when doctor is unavailable.'
    );

    System.assert(
        result.getErrors()[0].getMessage().contains(
            'Doctor is currently not available.'
        ),
        'Expected doctor unavailable error.'
    );
}
@IsTest
static void testAppointmentConflict() {

    Doctor__c doctor = [
        SELECT Id
        FROM Doctor__c
        LIMIT 1
    ];

    Datetime appointmentTime = System.now().addDays(3);

    // Create first appointment
    Appointment__c firstAppointment = new Appointment__c(
        Doctor__c = doctor.Id,
        Appointment_Date__c = appointmentTime,
        Type__c = 'Normal'
    );

    insert firstAppointment;

    // Create duplicate appointment
    Appointment__c secondAppointment = new Appointment__c(
        Doctor__c = doctor.Id,
        Appointment_Date__c = appointmentTime,
        Type__c = 'Normal'
    );

    Test.startTest();

    Database.SaveResult result = Database.insert(
        secondAppointment,
        false
    );

    Test.stopTest();

    // Duplicate should fail
    System.assertEquals(
        false,
        result.isSuccess(),
        'Duplicate appointment should not be created.'
    );

    // Verify correct error message
    System.assert(
        result.getErrors()[0].getMessage().contains(
            'Doctor already has an appointment at this time.'
        ),
        'Expected appointment conflict error.'
    );
}
@IsTest
static void testBulkAppointments() {

    Doctor__c doctor = [
        SELECT Id
        FROM Doctor__c
        LIMIT 1
    ];

    List<Appointment__c> appointments = new List<Appointment__c>();

    for (Integer i = 0; i < 10; i++) {

        appointments.add(
            new Appointment__c(
                Doctor__c = doctor.Id,
                Appointment_Date__c =
                    System.now().addDays(10).addHours(i),
                Type__c = 'Normal'
            )
        );
    }

    Test.startTest();

    Database.SaveResult[] results =
        Database.insert(appointments, false);

    Test.stopTest();

    Integer successCount = 0;

    for (Database.SaveResult result : results) {

        if (result.isSuccess()) {
            successCount++;
        }
    }

    System.assertEquals(
        10,
        successCount,
        'All 10 appointments should be created successfully.'
    );
}
}