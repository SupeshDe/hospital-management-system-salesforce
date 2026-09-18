trigger AppointmentConflictTrigger on Appointment__c (before insert) {

    if (Trigger.isBefore && Trigger.isInsert) {
        AppointmentHandler.beforeInsert(Trigger.new);
    }

}