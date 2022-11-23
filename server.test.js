const app = buildServer();

test('server should fail to load if no ORIGIN env variable exists', () => {
    let origin = process.env.ORIGIN;
    delete process.env.ORIGIN;
    let app = null;
    expect(() => app = build(opts)).toThrow(Error);
    process.env.ORIGIN = origin;
});

