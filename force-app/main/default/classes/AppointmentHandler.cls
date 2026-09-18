public class AppointmentHandler {

    public static void beforeInsert(List<Appointment__c> newApps) {

        // ============================================
        // STEP 1: Collect Doctor IDs and Appointment Times
        // ============================================

        Set<Id> doctorIds = new Set<Id>();
        Set<Datetime> appointmentTimes = new Set<Datetime>();

        for (Appointment__c app : newApps) {

            if (app.Doctor__c != null) {
                doctorIds.add(app.Doctor__c);
            }

            if (app.Appointment_Date__c != null) {
                appointmentTimes.add(app.Appointment_Date__c);
            }
        }


        // ============================================
        // STEP 2: Get Doctor Availability
        // ============================================

        Map<Id, Doctor__c> doctorMap =
            new Map<Id, Doctor__c>([
                SELECT Id, Availability__c
                FROM Doctor__c
                WHERE Id IN :doctorIds
            ]);


        // ============================================
        // STEP 3: Set Priority + Check Doctor Availability
        // ============================================

        for (Appointment__c app : newApps) {

            // Emergency appointment = High Priority
            if (app.Type__c == 'Emergency') {

                app.Priority__c = 'High';

            }
            // Normal appointment = Medium Priority
            else {

                app.Priority__c = 'Medium';
            }


            // Check Doctor Availability
            if (app.Doctor__c != null) {

                Doctor__c doc =
                    doctorMap.get(app.Doctor__c);

                if (
                    doc != null &&
                    doc.Availability__c == 'Not Available'
                ) {

                    app.addError(
                        'Doctor is currently not available.'
                    );
                }
            }
        }


        // ============================================
        // STEP 4: Check Existing Appointment Conflicts
        // ============================================

        if (
            !doctorIds.isEmpty() &&
            !appointmentTimes.isEmpty()
        ) {

            List<Appointment__c> existingApps = [

                SELECT
                    Id,
                    Doctor__c,
                    Appointment_Date__c

                FROM Appointment__c

                WHERE Doctor__c IN :doctorIds
                AND Appointment_Date__c IN :appointmentTimes
            ];


            // Store existing Doctor + DateTime combinations
            Set<String> existingKeys =
                new Set<String>();


            for (
                Appointment__c existing :
                existingApps
            ) {

                String key =
                    String.valueOf(
                        existing.Doctor__c
                    )
                    +
                    '-'
                    +
                    String.valueOf(
                        existing.Appointment_Date__c
                    );

                existingKeys.add(key);
            }


            // Check new appointments against existing ones
            for (
                Appointment__c app :
                newApps
            ) {

                if (
                    app.Doctor__c != null &&
                    app.Appointment_Date__c != null
                ) {

                    String key =
                        String.valueOf(
                            app.Doctor__c
                        )
                        +
                        '-'
                        +
                        String.valueOf(
                            app.Appointment_Date__c
                        );


                    if (
                        existingKeys.contains(key)
                    ) {

                        app.addError(
                            'Doctor already has an appointment at this time.'
                        );
                    }
                }
            }
        }
    }
}