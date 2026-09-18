import { LightningElement, wire } from 'lwc';

import getMyAppointments
    from '@salesforce/apex/HospitalDoctorController.getMyAppointments';

import createPrescription
    from '@salesforce/apex/HospitalDoctorController.createPrescription';

import getMyPrescriptions
    from '@salesforce/apex/HospitalDoctorController.getMyPrescriptions';

import { ShowToastEvent }
    from 'lightning/platformShowToastEvent';

import { refreshApex }
    from '@salesforce/apex';


export default class PrescriptionManager extends LightningElement {

    appointments = [];
    prescriptions = [];

    selectedAppointment;
    medicines = '';
    dosageInstructions = '';
    doctorNotes = '';

    isSaving = false;

    prescriptionsResult;


    /* =====================================================
       LOAD MY APPOINTMENTS
    ===================================================== */

    @wire(getMyAppointments)
    wiredAppointments({ data, error }) {

        if (data) {

            this.appointments = data;

        } else if (error) {

            this.appointments = [];

            console.error(
                'Appointment Error:',
                error
            );
        }
    }


    /* =====================================================
       LOAD MY PRESCRIPTIONS
    ===================================================== */

    @wire(getMyPrescriptions)
    wiredPrescriptions(result) {

        this.prescriptionsResult = result;

        const { data, error } = result;

        if (data) {

            this.prescriptions = data;

        } else if (error) {

            this.prescriptions = [];

            console.error(
                'Prescription Error:',
                error
            );
        }
    }


    /* =====================================================
       FORM HANDLERS
    ===================================================== */

    handleAppointmentChange(event) {

        this.selectedAppointment =
            event.target.value;
    }


    handleMedicinesChange(event) {

        this.medicines =
            event.target.value;
    }


    handleDosageChange(event) {

        this.dosageInstructions =
            event.target.value;
    }


    handleNotesChange(event) {

        this.doctorNotes =
            event.target.value;
    }


    /* =====================================================
       SAVE PRESCRIPTION
    ===================================================== */

    handleSavePrescription() {

        if (!this.selectedAppointment) {

            this.showToast(
                'Error',
                'Please select an appointment.',
                'error'
            );

            return;
        }


        if (!this.medicines.trim()) {

            this.showToast(
                'Error',
                'Please enter medicines.',
                'error'
            );

            return;
        }


        if (!this.dosageInstructions.trim()) {

            this.showToast(
                'Error',
                'Please enter dosage instructions.',
                'error'
            );

            return;
        }


        if (this.isSaving) {
            return;
        }


        this.isSaving = true;


        createPrescription({

            appointmentId:
                this.selectedAppointment,

            medicines:
                this.medicines,

            dosageInstructions:
                this.dosageInstructions,

            doctorNotes:
                this.doctorNotes

        })
        .then(() => {

            this.showToast(
                'Success',
                'Prescription created successfully.',
                'success'
            );


            this.clearForm();


            return refreshApex(
                this.prescriptionsResult
            );
        })
        .catch(error => {

            console.error(
                'Prescription Error:',
                error
            );


            let message =
                'Unable to create prescription.';


            if (
                error.body &&
                error.body.message
            ) {

                message =
                    error.body.message;
            }


            this.showToast(
                'Error',
                message,
                'error'
            );
        })
        .finally(() => {

            this.isSaving = false;
        });
    }


    /* =====================================================
       CLEAR FORM
    ===================================================== */

    clearForm() {

        this.selectedAppointment =
            undefined;

        this.medicines =
            '';

        this.dosageInstructions =
            '';

        this.doctorNotes =
            '';
    }


    /* =====================================================
       APPOINTMENT OPTIONS
    ===================================================== */

    get appointmentOptions() {

        return this.appointments.map(
            appointment => {

                const doctorName =
                    appointment.Doctor__r &&
                    appointment.Doctor__r.Name
                        ? appointment.Doctor__r.Name
                        : 'Doctor';


                return {

                    label:
                        'Dr. ' +
                        doctorName +
                        ' - ' +
                        appointment.Appointment_Date__c,

                    value:
                        appointment.Id
                };
            }
        );
    }


    /* =====================================================
       TOAST
    ===================================================== */

    showToast(
        title,
        message,
        variant
    ) {

        this.dispatchEvent(
            new ShowToastEvent({

                title:
                    title,

                message:
                    message,

                variant:
                    variant
            })
        );
    }
}