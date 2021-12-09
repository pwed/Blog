cdk: hugo
	cd cdk && npm ci && cdk synth -q

hugo: ghostwriter
	hugo

ghostwriter:
	cd themes/ghostwriter && npm i && npm run build
