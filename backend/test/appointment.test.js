require("dotenv").config();
const app = require("../app");
const mockServer = require("supertest");
const Appointment = require("../model/appointment");
const { startDb, stopDb, deleteAll } = require("./util/inMemoryDb");

describe("appointment.js route, /api/appointments", () => {
    let connection;
    let mongoServer;
    let client;

    beforeAll(async () => {
        const result = await startDb();
        [connection, mongoServer] = result;
        client = mockServer.agent(app);
    });

    afterAll(async () => {
        await stopDb(connection, mongoServer);
    });

    afterEach(async () => {
        await deleteAll(Appointment);
    });

    describe("POST requests to /api/appointments", () => {
        describe("if a proper appointment arrives the response is 200, and the db contains the item with an id", () => {
            test("should return 200, and the new appointment with _id property", async () => {
                // given

                // 
                // console.log(new Date());
                // console.log(new Date() + 60000);
                // const startTime = new Date() + 60000;
                // console.log(startTime);
                // const response = await client.post("/api/appointments").send({
                //     start: startTime.toISOString(),
                //     end: (new Date() + 90000).toISOString(),
                //     comment: "Consultation about APIs",
                // });
                const response = await client.post("/api/appointments").send({
                    start: "2022-09-07T13:10",
                    end: "2022-09-07T13:40",
                    comment: "Consultation about APIs",
                });

                // then
                expect(response.status).toBe(200);
                console.log(response.body.newAppointment);
                expect(response.body.newAppointment).toHaveProperty("_id");
            });
        });

        describe("requests with errors", () => {
            describe("start time is missing or invalid", () => {
                test("should return 400, and a meaningful message", async () => {
                    // given

                    // when
                    const response = await client.post("/api/appointments").send({
                        end: "2022-05-07T13:10",
                        comment: "Consultation about APIs",
                    });

                    // then
                    expect(response.status).toBe(400);
                    expect(response.text).toBe("Start time is missing or invalid");
                });
            });

            describe("end time is missing or invalid", () => {
                test("should return 400, and a meaningful message", async () => {
                    // given

                    // when
                    const response = await client.post("/api/appointments").send({
                        start: "2022-05-07T13:10",
                        comment: "Consultation about APIs",
                    });

                    // then
                    expect(response.status).toBe(400);
                    expect(response.text).toBe("End time is missing or invalid");
                });
            });

            describe("start time is in the past", () => {
                test("should return 400, and a meaningful message", async () => {
                    // given

                    // when
                    const response = await client.post("/api/appointments").send({
                        start: "2021-05-07T13:10",
                        end: "2021-05-07T13:40",
                        comment: "Consultation about APIs",
                    });

                    // then
                    expect(response.status).toBe(400);
                    expect(response.text).toBe("Wrong start time, its in the past");
                });
            });

            describe("end time is earlier or at the same moment as start", () => {
                test("should return 400, and a meaningful message", async () => {
                    // given

                    // when
                    const response = await client.post("/api/appointments").send({
                        start: "2022-09-07T13:10",
                        end: "2022-09-07T13:00",
                        comment: "Consultation about APIs",
                    });

                    // then
                    console.log((new Date() - 60000), new Date());
                    expect(response.status).toBe(400);
                    expect(response.text).toBe("Wrong request, end time is earlier or at the same moment as start");
                });
            });

        });
    });
});