import { LightningElement, wire } from 'lwc';

import getDoctors
    from '@salesforce/apex/HospitalDoctorController.getDoctors';

import bookAppointment
    from '@salesforce/apex/HospitalDoctorController.bookAppointment';

import getMyAppointments
    from '@salesforce/apex/HospitalDoctorController.getMyAppointments';

import cancelAppointment
    from '@salesforce/apex/HospitalDoctorController.cancelAppointment';

import { ShowToastEvent }
    from 'lightning/platformShowToastEvent';

import { refreshApex }
    from '@salesforce/apex';


export default class HospitalAppointmentPortal extends LightningElement {

    // ============================================================
    // DOCTORS
    // ============================================================

    doctors = [];
    filteredDoctors = [];

    searchTerm = '';
    availabilityFilter = 'All';


    // ============================================================
    // APPOINTMENTS
    // ============================================================

    appointments = [];
    appointmentsResult;

    appointmentSearchTerm = '';
    appointmentTypeFilter = 'All';


    // ============================================================
    // BOOKING
    // ============================================================

    // Combined ISO-style value ("YYYY-MM-DDTHH:mm"), kept for
    // validation + the Apex call. Built from the two fields below.
    appointmentDate = '';

    // Separate date / time inputs, to match the "Appointment
    // Date & Time" field split shown in the design. Time is
    // captured as 12-hour hour + minute + AM/PM selects so it
    // always displays with AM/PM regardless of browser locale.
    appointmentDateOnly = '';
    appointmentTimeOnly = '09:00';

    selectedHour = '09';
    selectedMinute = '00';
    selectedMeridiem = 'AM';

    // Doctor picked from the "Select Doctor" dropdown in the
    // booking form (top of page), distinct from clicking
    // "Book Appointment" directly on a doctor card below.
    selectedDoctorId = '';

    appointmentType = 'Normal';

    isBooking = false;
    isCancelling = false;

    error;


    // ============================================================
    // APPOINTMENT TYPE OPTIONS
    // ============================================================

    appointmentTypeOptions = [
        {
            label: 'Normal',
            value: 'Normal'
        },
        {
            label: 'Emergency',
            value: 'Emergency'
        }
    ];


    // ============================================================
    // DOCTOR AVAILABILITY OPTIONS
    // ============================================================

    availabilityOptions = [
        {
            label: 'All Doctors',
            value: 'All'
        },
        {
            label: 'Available',
            value: 'Available'
        },
        {
            label: 'Not Available',
            value: 'Not Available'
        }
    ];


    // ============================================================
    // APPOINTMENT FILTER OPTIONS
    // ============================================================

    appointmentTypeFilterOptions = [
        {
            label: 'All Appointments',
            value: 'All'
        },
        {
            label: 'Normal',
            value: 'Normal'
        },
        {
            label: 'Emergency',
            value: 'Emergency'
        }
    ];


    // ============================================================
    // TIME PICKER OPTIONS (hour / minute / AM-PM)
    // ============================================================

    hourOptions = [
        { label: '01', value: '01' },
        { label: '02', value: '02' },
        { label: '03', value: '03' },
        { label: '04', value: '04' },
        { label: '05', value: '05' },
        { label: '06', value: '06' },
        { label: '07', value: '07' },
        { label: '08', value: '08' },
        { label: '09', value: '09' },
        { label: '10', value: '10' },
        { label: '11', value: '11' },
        { label: '12', value: '12' }
    ];

    minuteOptions = [
        { label: '00', value: '00' },
        { label: '15', value: '15' },
        { label: '30', value: '30' },
        { label: '45', value: '45' }
    ];

    meridiemOptions = [
        { label: 'AM', value: 'AM' },
        { label: 'PM', value: 'PM' }
    ];


    // ============================================================
    // MINIMUM DATE/TIME
    // ============================================================

    get minAppointmentDate() {

        const now = new Date();

        const year = now.getFullYear();

        const month = String(
            now.getMonth() + 1
        ).padStart(2, '0');

        const day = String(
            now.getDate()
        ).padStart(2, '0');

        const hours = String(
            now.getHours()
        ).padStart(2, '0');

        const minutes = String(
            now.getMinutes()
        ).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }


    get minAppointmentDateOnly() {

        return this.minAppointmentDate.split('T')[0];

    }


    // ============================================================
    // DOCTOR OPTIONS (for the "Select Doctor" dropdown)
    // ============================================================

    get doctorOptions() {

        return this.doctors
            .filter(
                doctor =>
                    doctor.Availability__c !== 'Not Available'
            )
            .map(doctor => ({
                label: doctor.Name,
                value: doctor.Id
            }));

    }


    // ============================================================
    // LOAD DOCTORS
    // ============================================================

    @wire(getDoctors)
    wiredDoctors({ data, error }) {

        if (data) {

            this.doctors = data;

            this.filteredDoctors = data.map(
                doctor => ({
                    ...doctor,
                    isUnavailable:
                        doctor.Availability__c === 'Not Available'
                })
            );

            this.error = undefined;

        } else if (error) {

            this.doctors = [];
            this.filteredDoctors = [];
            this.error = error;

            console.error(
                'Doctor Error:',
                error
            );
        }
    }


    // ============================================================
    // LOAD APPOINTMENTS
    // ============================================================

    @wire(getMyAppointments)
    wiredAppointments(result) {

        this.appointmentsResult = result;

        const {
            data,
            error
        } = result;


        if (data) {

            this.appointments = data.map(
                appointment => {

                    const doctorName =
                        appointment.Doctor__r &&
                        appointment.Doctor__r.Name
                            ? appointment.Doctor__r.Name
                            : 'Doctor';


                    const apptDate =
                        appointment.Appointment_Date__c
                            ? new Date(appointment.Appointment_Date__c)
                            : null;


                    const dayNumber =
                        apptDate
                            ? String(apptDate.getDate()).padStart(2, '0')
                            : '--';


                    const monthLabel =
                        apptDate
                            ? apptDate
                                  .toLocaleString('en-US', { month: 'short' })
                                  .toUpperCase()
                            : '';


                    const timeLabel =
                        apptDate
                            ? apptDate.toLocaleString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                              })
                            : '';


                    let statusClass =
                        'appointment-status status-upcoming';

                    if (appointment.Status__c === 'Completed') {
                        statusClass =
                            'appointment-status status-completed';
                    }

                    if (appointment.Status__c === 'Cancelled') {
                        statusClass =
                            'appointment-status status-cancelled';
                    }


                    return {
                        ...appointment,

                        doctorName,

                        dayNumber,
                        monthLabel,
                        timeLabel,
                        statusClass,

                        canCancel:
                            appointment.Status__c !== 'Cancelled',

                        isCancelled:
                            appointment.Status__c === 'Cancelled'
                    };

                }
            );

        } else if (error) {

            this.appointments = [];

            console.error(
                'Appointment Error:',
                error
            );
        }
    }


    // ============================================================
    // FILTERED APPOINTMENTS
    // ============================================================

    get filteredAppointments() {

        return this.appointments.filter(
            appointment => {

                const doctorName =
                    appointment.Doctor__r &&
                    appointment.Doctor__r.Name
                        ? appointment.Doctor__r.Name.toLowerCase()
                        : '';


                const matchesSearch =
                    doctorName.includes(
                        this.appointmentSearchTerm
                    );


                const matchesType =
                    this.appointmentTypeFilter === 'All' ||
                    appointment.Type__c ===
                        this.appointmentTypeFilter;


                return (
                    matchesSearch &&
                    matchesType
                );
            }
        );
    }


    // ============================================================
    // DATE / TIME CHANGE (split inputs)
    // ============================================================

    handleDateOnlyChange(event) {

        this.appointmentDateOnly =
            event.target.value;

        this.syncAppointmentDateTime();

    }


    handleHourChange(event) {

        this.selectedHour =
            event.target.value;

        this.convertTo24HourTime();

    }


    handleMinuteChange(event) {

        this.selectedMinute =
            event.target.value;

        this.convertTo24HourTime();

    }


    handleMeridiemChange(event) {

        this.selectedMeridiem =
            event.target.value;

        this.convertTo24HourTime();

    }


    convertTo24HourTime() {

        let hour =
            parseInt(this.selectedHour, 10);


        if (this.selectedMeridiem === 'AM') {

            if (hour === 12) {
                hour = 0;
            }

        } else {

            if (hour !== 12) {
                hour += 12;
            }

        }


        const hh =
            String(hour).padStart(2, '0');

        this.appointmentTimeOnly =
            `${hh}:${this.selectedMinute}`;

        this.syncAppointmentDateTime();

    }


    syncAppointmentDateTime() {

        if (
            !this.appointmentDateOnly ||
            !this.appointmentTimeOnly
        ) {

            this.appointmentDate = '';

            return;

        }


        const combined =
            `${this.appointmentDateOnly}T${this.appointmentTimeOnly}`;

        const selectedDate =
            new Date(combined);

        const now =
            new Date();


        if (
            isNaN(selectedDate.getTime()) ||
            selectedDate <= now
        ) {

            this.showToast(
                'Invalid Date & Time',
                'Please select a future date and time.',
                'error'
            );

            this.appointmentDate = '';

            return;

        }


        this.appointmentDate =
            selectedDate.toISOString();

    }


    // ============================================================
    // DOCTOR SELECT (booking form dropdown)
    // ============================================================

    handleDoctorSelect(event) {

        this.selectedDoctorId =
            event.target.value;

    }


    // ============================================================
    // APPOINTMENT TYPE CHANGE
    // ============================================================

    handleTypeChange(event) {

        this.appointmentType =
            event.target.value;

    }


    // ============================================================
    // DOCTOR SEARCH
    // ============================================================

    handleDoctorSearch(event) {

        this.searchTerm =
            event.target.value
                .toLowerCase()
                .trim();

        this.filterDoctors();

    }


    // ============================================================
    // AVAILABILITY FILTER
    // ============================================================

    handleAvailabilityFilter(event) {

        this.availabilityFilter =
            event.target.value;

        this.filterDoctors();

    }


    // ============================================================
    // FILTER DOCTORS
    // ============================================================

    filterDoctors() {

        this.filteredDoctors =
            this.doctors
                .filter(doctor => {

                    const doctorName =
                        doctor.Name
                            ? doctor.Name.toLowerCase()
                            : '';

                    const availability =
                        doctor.Availability__c
                            ? doctor.Availability__c
                            : '';


                    const matchesSearch =
                        doctorName.includes(
                            this.searchTerm
                        );


                    const matchesAvailability =
                        this.availabilityFilter === 'All' ||
                        availability ===
                            this.availabilityFilter;


                    return (
                        matchesSearch &&
                        matchesAvailability
                    );

                })
                .map(doctor => ({

                    ...doctor,

                    isUnavailable:
                        doctor.Availability__c ===
                        'Not Available'

                }));
    }


    // ============================================================
    // APPOINTMENT SEARCH
    // ============================================================

    handleAppointmentSearch(event) {

        this.appointmentSearchTerm =
            event.target.value
                .toLowerCase()
                .trim();

    }


    // ============================================================
    // APPOINTMENT TYPE FILTER
    // ============================================================

    handleAppointmentTypeFilter(event) {

        this.appointmentTypeFilter =
            event.target.value;

    }


    // ============================================================
    // BOOK APPOINTMENT — from a doctor card
    // ============================================================

    handleBook(event) {

        const doctorId =
            event.currentTarget.dataset.id;

        this.bookWithDoctor(doctorId);

    }


    // ============================================================
    // BOOKING FORM — "Book Appointment" confirm button
    // ============================================================

    // True once every field the form needs has been filled in.
    // Drives both the button's disabled state and the hint text.
    get canBookFromForm() {

        return Boolean(
            this.selectedDoctorId &&
            this.appointmentDate &&
            this.appointmentType
        );

    }


    get isConfirmDisabled() {

        return (
            !this.canBookFromForm ||
            this.isBooking
        );

    }


    handleBookFromForm() {

        if (!this.selectedDoctorId) {

            this.showToast(
                'Select a Doctor',
                'Choose a doctor from the dropdown above before booking.',
                'error'
            );

            return;

        }

        this.bookWithDoctor(
            this.selectedDoctorId
        );

    }


    // ============================================================
    // SHARED BOOKING LOGIC
    // ============================================================

    bookWithDoctor(doctorId) {

        // --------------------------------------------------------
        // DOCTOR VALIDATION
        // --------------------------------------------------------

        if (!doctorId) {

            this.showToast(
                'Booking Error',
                'Doctor information is missing.',
                'error'
            );

            return;
        }


        // --------------------------------------------------------
        // DATE VALIDATION
        // --------------------------------------------------------

        if (!this.appointmentDate) {

            this.showToast(
                'Appointment Required',
                'Please select a date and time.',
                'error'
            );

            return;
        }


        const selectedDate =
            new Date(this.appointmentDate);

        const now =
            new Date();


        if (
            isNaN(selectedDate.getTime()) ||
            selectedDate <= now
        ) {

            this.showToast(
                'Invalid Date & Time',
                'Please select a future appointment date and time.',
                'error'
            );

            return;
        }


        // --------------------------------------------------------
        // APPOINTMENT TYPE VALIDATION
        // --------------------------------------------------------

        if (!this.appointmentType) {

            this.showToast(
                'Appointment Type Required',
                'Please select an appointment type.',
                'error'
            );

            return;
        }


        // --------------------------------------------------------
        // PREVENT DOUBLE BOOKING CLICK
        // --------------------------------------------------------

        if (this.isBooking) {
            return;
        }


        this.isBooking = true;


        // --------------------------------------------------------
        // CALL APEX
        // --------------------------------------------------------

        bookAppointment({

            doctorId:
                doctorId,

            appointmentDate:
                this.appointmentDate,

            appointmentType:
                this.appointmentType

        })

        .then(() => {

            this.showToast(
                'Appointment Confirmed',
                'Your appointment has been booked successfully.',
                'success'
            );


            // Clear booking form state — reset time back to the
            // 09:00 AM default rather than blank, since the time
            // picker is now three selects (no empty state).
            this.appointmentDate = '';
            this.appointmentDateOnly = '';
            this.appointmentTimeOnly = '09:00';
            this.selectedHour = '09';
            this.selectedMinute = '00';
            this.selectedMeridiem = 'AM';
            this.selectedDoctorId = '';


            // Clear HTML inputs
            const dateInput =
                this.template.querySelector(
                    '#appointmentDateOnly'
                );

            const hourSelect =
                this.template.querySelector(
                    '#hourSelect'
                );

            const minuteSelect =
                this.template.querySelector(
                    '#minuteSelect'
                );

            const meridiemSelect =
                this.template.querySelector(
                    '#meridiemSelect'
                );

            const doctorSelect =
                this.template.querySelector(
                    '#selectedDoctor'
                );


            if (dateInput) {
                dateInput.value = '';
            }

            if (hourSelect) {
                hourSelect.value = '09';
            }

            if (minuteSelect) {
                minuteSelect.value = '00';
            }

            if (meridiemSelect) {
                meridiemSelect.value = 'AM';
            }

            if (doctorSelect) {
                doctorSelect.value = '';
            }


            // Refresh appointment history
            return refreshApex(
                this.appointmentsResult
            );

        })

        .catch(error => {

            console.error(
                'Booking Error:',
                error
            );


            const message =
                this.getErrorMessage(
                    error,
                    'Unable to book appointment.'
                );


            this.showToast(
                'Booking Failed',
                message,
                'error'
            );

        })

        .finally(() => {

            this.isBooking = false;

        });

    }


    // ============================================================
    // CANCEL APPOINTMENT
    // ============================================================

    handleCancelAppointment(event) {

        const appointmentId =
            event.currentTarget.dataset.id;


        if (!appointmentId) {

            this.showToast(
                'Cancellation Error',
                'Appointment information is missing.',
                'error'
            );

            return;
        }


        if (this.isCancelling) {
            return;
        }


        this.isCancelling = true;


        cancelAppointment({

            appointmentId:
                appointmentId

        })

        .then(() => {

            this.showToast(
                'Appointment Cancelled',
                'Your appointment has been cancelled successfully.',
                'success'
            );


            return refreshApex(
                this.appointmentsResult
            );

        })

        .catch(error => {

            console.error(
                'Cancellation Error:',
                error
            );


            const message =
                this.getErrorMessage(
                    error,
                    'Unable to cancel appointment.'
                );


            this.showToast(
                'Cancellation Failed',
                message,
                'error'
            );

        })

        .finally(() => {

            this.isCancelling = false;

        });

    }


    // ============================================================
    // PRESCRIPTION NAVIGATION
    // ============================================================

    handlePrescriptionNavigation() {

        /*
         * prescriptionManager is a separate component
         * placed in Experience Builder.
         *
         * LWC shadow DOM cannot reliably access a sibling
         * component using document.querySelector().
         *
         * Therefore we scroll to the lower section where
         * prescriptionManager is placed.
         */

        window.scrollTo({

            top:
                document.body.scrollHeight,

            behavior:
                'smooth'

        });

    }


    // ============================================================
    // "VIEW ALL" NAVIGATION
    // ============================================================

    handleViewAllDoctors() {

        const section =
            this.template.querySelector(
                '.doctors-section'
            );

        if (section) {

            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

        }

    }


    handleViewAllAppointments() {

        const section =
            this.template.querySelector(
                '.appointment-section'
            );

        if (section) {

            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

        }

    }


    // ============================================================
    // ERROR MESSAGE HELPER
    // ============================================================

    getErrorMessage(
        error,
        defaultMessage
    ) {

        if (
            error &&
            error.body &&
            error.body.message
        ) {

            return error.body.message;

        }


        if (
            error &&
            error.message
        ) {

            return error.message;

        }


        if (
            error &&
            error.body &&
            Array.isArray(error.body)
        ) {

            return error.body
                .map(item => item.message)
                .join(', ');

        }


        return defaultMessage;

    }


    // ============================================================
    // TOAST
    // ============================================================

    showToast(
        title,
        message,
        variant
    ) {

        this.dispatchEvent(
            new ShowToastEvent({

                title,

                message,

                variant

            })
        );

    }

}