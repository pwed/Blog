cdk: hugo
	cd cdk && npm ci && cdk synth -q

hugo: ghostwriter
	hugo --minify

ghostwriter:
	cd themes/ghostwriter && npm i && npm run build
