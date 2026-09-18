public with sharing class HospitalDoctorController {

    @AuraEnabled(cacheable=true)
    public static List<Doctor__c> getDoctors() {

        return [
            SELECT Id,
                   Name,
                   Availability__c
            FROM Doctor__c
            ORDER BY Name
        ];
    }

    @AuraEnabled
    public static Id bookAppointment(
        Id doctorId,
        Datetime appointmentDate,
        String appointmentType
    ) {

        try {

            if (doctorId == null) {
                throw new AuraHandledException(
                    'Please select a doctor.'
                );
            }

            if (appointmentDate == null) {
                throw new AuraHandledException(
                    'Please select appointment date and time.'
                );
            }

            if (appointmentDate <= System.now()) {
                throw new AuraHandledException(
                    'Appointment date and time must be in the future.'
                );
            }

            if (String.isBlank(appointmentType)) {
                throw new AuraHandledException(
                    'Please select appointment type.'
                );
            }

            String currentUserEmail =
                UserInfo.getUserEmail();

            List<Patient__c> patients = [
                SELECT Id,
                       Name,
                       Patient_Email__c,
                       Age__c,
                       Phone__c
                FROM Patient__c
                WHERE Patient_Email__c = :currentUserEmail
                LIMIT 1
            ];

            if (patients.isEmpty()) {
                throw new AuraHandledException(
                    'Patient profile not found. Please create your Patient profile first.'
                );
            }

            Patient__c patient = patients[0];

            Doctor__c doctor = [
                SELECT Id,
                       Name,
                       Availability__c
                FROM Doctor__c
                WHERE Id = :doctorId
                LIMIT 1
            ];

            if (doctor.Availability__c == 'Not Available') {
                throw new AuraHandledException(
                    'Doctor is currently not available.'
                );
            }

            Appointment__c appointment =
                new Appointment__c();

            appointment.Patient__c =
                patient.Id;

            appointment.Doctor__c =
                doctorId;

            appointment.Appointment_Date__c =
                appointmentDate;

            appointment.Type__c =
                appointmentType;

            if (appointmentType == 'Emergency') {
                appointment.Priority__c = 'High';
            } else {
                appointment.Priority__c = 'Medium';
            }

            insert appointment;

            return appointment.Id;

        } catch (DmlException e) {

            throw new AuraHandledException(
                'Booking failed: ' +
                e.getDmlMessage(0)
            );

        } catch (AuraHandledException e) {

            throw e;

        } catch (Exception e) {

            throw new AuraHandledException(
                'Booking failed: ' +
                e.getMessage()
            );
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Appointment__c> getMyAppointments() {

        return [
            SELECT Id,
                   Name,
                   Appointment_Date__c,
                   Type__c,
                   Priority__c,
                   Status__c,
                   Patient__c,
                   Patient__r.Name,
                   Doctor__c,
                   Doctor__r.Name
            FROM Appointment__c
            WHERE CreatedById = :UserInfo.getUserId()
            ORDER BY Appointment_Date__c DESC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Prescription__c> getMyPrescriptions() {

        return [
            SELECT Id,
                   Name,
                   Prescription_Date__c,
                   Medicines__c,
                   Dosage_Instructions__c,
                   Doctor_Notes__c,
                   Appointment__c,
                   Appointment__r.Patient__c,
                   Appointment__r.Patient__r.Name,
                   Appointment__r.Doctor__c,
                   Appointment__r.Doctor__r.Name
            FROM Prescription__c
            WHERE CreatedById = :UserInfo.getUserId()
            ORDER BY Prescription_Date__c DESC
        ];
    }

    @AuraEnabled
    public static void cancelAppointment(
        Id appointmentId
    ) {

        try {

            if (appointmentId == null) {
                throw new AuraHandledException(
                    'Appointment ID is missing.'
                );
            }

            Appointment__c appointment = [
                SELECT Id,
                       Status__c,
                       CreatedById,
                       Patient__c
                FROM Appointment__c
                WHERE Id = :appointmentId
                LIMIT 1
            ];

            if (appointment.CreatedById != UserInfo.getUserId()) {
                throw new AuraHandledException(
                    'You can cancel only your own appointment.'
                );
            }

            if (appointment.Status__c == 'Cancelled') {
                throw new AuraHandledException(
                    'Appointment is already cancelled.'
                );
            }

            appointment.Status__c = 'Cancelled';

            update appointment;

        } catch (DmlException e) {

            String errorMessage =
                'Unable to cancel appointment.';

            if (e.getNumDml() > 0) {
                errorMessage = e.getDmlMessage(0);
            }

            throw new AuraHandledException(
                'Cancellation failed: ' +
                errorMessage
            );

        } catch (AuraHandledException e) {

            throw e;

        } catch (Exception e) {

            throw new AuraHandledException(
                'Cancellation failed: ' +
                e.getMessage()
            );
        }
    }

    @AuraEnabled
    public static Id createPrescription(
        Id appointmentId,
        String medicines,
        String dosageInstructions,
        String doctorNotes
    ) {

        try {

            if (appointmentId == null) {
                throw new AuraHandledException(
                    'Please select an appointment.'
                );
            }

            if (String.isBlank(medicines)) {
                throw new AuraHandledException(
                    'Please enter medicines.'
                );
            }

            if (String.isBlank(dosageInstructions)) {
                throw new AuraHandledException(
                    'Please enter dosage instructions.'
                );
            }

            Appointment__c appointment = [
                SELECT Id,
                       Doctor__c,
                       CreatedById,
                       Patient__c
                FROM Appointment__c
                WHERE Id = :appointmentId
                LIMIT 1
            ];

            if (appointment.CreatedById != UserInfo.getUserId()) {
                throw new AuraHandledException(
                    'You can create a prescription only for your own appointment.'
                );
            }

            Prescription__c prescription =
                new Prescription__c();

            prescription.Appointment__c =
                appointmentId;

            prescription.Medicines__c =
                medicines;

            prescription.Dosage_Instructions__c =
                dosageInstructions;

            prescription.Doctor_Notes__c =
                doctorNotes;

            prescription.Prescription_Date__c =
                Date.today();

            insert prescription;

            return prescription.Id;

        } catch (DmlException e) {

            throw new AuraHandledException(
                'Prescription failed: ' +
                e.getDmlMessage(0)
            );

        } catch (AuraHandledException e) {

            throw e;

        } catch (Exception e) {

            throw new AuraHandledException(
                'Prescription failed: ' +
                e.getMessage()
            );
        }
    }
}