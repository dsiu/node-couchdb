REPORTER = list

test:
	@find test/test-*.js | xargs -n 1 -t node

test-mocha:
	@find test/mocha/test-*.js | xargs -n 1 -t './node_modules/.bin/mocha' --reporter $(REPORTER)

.PHONY: test