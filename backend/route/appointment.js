const router = require("express").Router();
const Appointment = require("../model/appointment");

// "2022-07-19T13:10"
router.post("/", async (req, res) => {
    const { start, end, comment } = req.body;
    if (!start || start.length !== 16) return res.status(400).send("Start time is missing or invalid");
    if (!end || end.length !== 16) return res.status(400).send("End time is missing or invalid");

    const now = new Date();
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (startTime < now) return res.status(400).send("Wrong start time, its in the past");
    if (endTime <= startTime) return res.status(400).send("Wrong request, end time is earlier or at the same moment as start");
    if (endTime - startTime > 1800000) return res.status(400).send(`Wrong request, you can book a maximum of 30 minutes. Your appointment is ${(endTime - startTime) / 60000} minutes long, try to book ${Math.ceil((endTime - startTime) / 1800000)} appointment slots instead.`);

    const date = startTime.toISOString().split("T")[0];

    const appointmentsToday = await Appointment.find({ date: date });
    for (const appointment of appointmentsToday) {
        if (startTime >= appointment.startTime && startTime < appointment.endTime) {
            return res.status(400).send("Start time already booked");
        } else if (endTime > appointment.startTime && endTime <= appointment.endTime) {
            return res.status(400).send("End time already booked");
        }
    }

    const newAppointment = Appointment({
        date,
        startTime,
        endTime,
        comment,
    });
    await newAppointment.save()

    return res.status(200).json({ newAppointment });
});

router.get("/", async (req, res) => {
    const { page, date } = req.query;

    if (!page && !date) {
        const now = new Date();

        const appointments = await Appointment.find({ startTime: { $gt: now } }).sort({ startTime: 1 }).limit(10);
        if (!appointments) return res.status(404).send("Appointment not found");

        res.status(200).json({ appointments });
    }

    const byDate = date ? { date: date } : null;
    const toSkip = page > 1 ? (page - 1) * 10 : 0;

    const appointments = await Appointment.find(byDate).sort({ startTime: -1 }).skip(toSkip).limit(10);
    if (appointments.length === 0) return res.status(404).send("No appointments on this day");

    res.status(200).json({ appointments });
});

router.get("/:id", async (req, res) => {
    const id = req.params.id;

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).send("Appointment not found");

    res.status(200).json({ appointment });
});

router.patch("/:id", async (req, res) => {
    const { start, end, comment } = req.body;
    if (!start || start.length !== 16) return res.status(400).send("Start time is missing or invalid");
    if (!end || end.length !== 16) return res.status(400).send("End time is missing or invalid");

    const id = req.params.id;

    const originalAppointment = await Appointment.findById(id);
    if (!originalAppointment) return res.status(404).send("Appointment not found");

    const now = new Date();
    console.log(now);
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (startTime < now) return res.status(400).send("Wrong start time, its in the past");
    if (endTime < startTime) return res.status(400).send("Wrong request, end time is earlier than start");
    if (endTime - startTime > 1800000) return res.status(400).send(`Wrong request, you can book a maximum of 30 minutes. Your appointment is ${(endTime - startTime) / 60000} minutes long, try to book ${Math.ceil((endTime - startTime) / 1800000)} appointment slots instead.`);

    const date = startTime.toISOString().split("T")[0];

    const appointmentsToday = await Appointment.find({ date: date });

    for (const appointment of appointmentsToday) {
        if (startTime >= appointment.startTime && startTime < appointment.endTime) {
            return res.status(400).send("Start time already booked");
        } else if (endTime > appointment.startTime && endTime <= appointment.endTime) {
            return res.status(400).send("End time already booked");
        }
    }

    const updatedAppointment = await Appointment.findOneAndUpdate(
        { _id: id },
        {
            date,
            startTime,
            endTime,
            comment,
        },
        { new: true }
    );
    if (!updatedAppointment) return res.status(500).send("Something went wrong");

    res.status(200).json({ updatedAppointment });
});

router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    const appointment = await Appointment.deleteOne({ _id: id });

    if (appointment.deletedCount === 0) return res.status(400).send("Appointment not found");

    return res.status(200).send("Appointment successfully deleted");
});

module.exports = router;