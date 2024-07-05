# Example data

Some examples showing how addresses, identities, names and document details are encoded by GOV.UK One Login in JSON format.

These examples are synthetic and have no relation to the [test user profiles](https://docs.sign-in.service.gov.uk/test-your-integration/using-integration-for-testing/#test-successful-user-journeys) that we provide to service teams when they need to test journeys in the integration environment.


## Addresses

[example addresses](addresses) contains a set of example JSON fragments containing one or more addresses in an array. 

Examples [eg1.json](addresses/eg1.json) to [eg4.json](addresses/eg4.json)  contain a single address each, [eg5.json](addresses/eg5.json) contains two addresses in an array.

Read the technical documentation [understand your user’s address claim](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/prove-users-identity/#understand-your-user-s-address-claim) to understand the individual properties.

Example addresses:
- [eg1.json](addresses/eg1.json)
- [eg2.json](addresses/eg2.json)
- [eg3.json](addresses/eg3.json)
- [eg4.json](addresses/eg4.json)
- [eg5.json](addresses/eg5.json)


## Identities

[example identities](identities) contains a set of examples showing the identity information returned from the [`/userinfo`](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#retrieve-user-information) endpoint

|file|description|
|----|-----------|
|`userinfo-{NAME}-auth.json` | the information from the [`/userinfo` endpoint for an authentication only journey](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#receive-response-for-retrieve-user-information)|
|`userinfo-{NAME}-idv.json` | the information from the [`/userinfo` endpoint](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/prove-users-identity/#prove-your-user-39-s-identity) for an identity journey|
| `coreIdentity-{NAME}.json`| contains the the decoded version of the JWT in the `.”https://vocab.account.gov.uk/v1/coreIdentityJWT ”` property|


Example identities:
- [atinuke](identities/atinuke)
- [davina](identities/davina)
- [julie](identities/jilie)
- [kenneth](identities/kenneth)
- [lisa](identities/lisa)



## Names

Read the technical documentation [understand your user’s name details in the credentialSubject claim](https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/prove-users-identity/#understand-your-user-s-core-identity-claim) to understand the individual properties.

Example names:
 - [ex01 single given name and single family name](names/ex01-single-given-name-and-single-family-name.json)
 - [ex02 multiple given names and a single family name](names/ex02-multiple-given-names-and-a-single-family-name.json)
 - [ex03 single given name and multiple family name words](names/ex03-single-given-name-and-multiple-family-name-words.json)
 - [ex04a given name with hyphen in the viz section](names/ex04a-given-name-with-hyphen-in-the-viz-section.json)
 - [ex04b given name with hyphen replaced by space in the mrz](names/ex04b-given-name-with-hyphen-replaced-by-space-in-the-mrz.json)
 - [ex05a names with apostrophe in the family name in the viz section](names/ex05a-names-with-apostrophe-in-the-family-name-in-the-viz-section.json)
 - [ex05b names with apostrophe in the family name in the viz section and replace with space in mrz](names/ex05b-names-with-apostrophe-in-the-family-name-in-the-viz-section-and-replace-with-space-in-mrz.json)
 - [ex06a names with hyphen in the family name in the viz section](names/ex06a-names-with-hyphen-in-the-family-name-in-the-viz-section.json)
 - [ex06b names with hyphen in the family name on the viz section and hyphen removed in mrz](names/ex06b-names-with-hyphen-in-the-family-name-on-the-viz-section-and-hyphen-removed-in-mrz.json)
 - [ex09 name with truncated given name and acceptable family name](names/ex09-name-with-truncated-given-name-and-acceptable-family-name.json)
 - [ex10 name with truncated given name and truncated family name](names/ex10-name-with-truncated-given-name-and-truncated-family-name.json)
 - [ex11 name with truncated family name and acceptable given name](names/ex11-name-with-truncated-family-name-and-acceptable-given-name.json)
 - [ex12 names with diacritics in the viz section](names/ex12-names-with-diacritics-in-the-viz-section.json)
 - [ex13 names with titles in the mrz](names/ex13-names-with-titles-in-the-mrz.json)
 - [ex14 names with post nominals in the mrz](names/ex14-names-with-post-nominals-in-the-mrz.json)
 - [ex15 names with jnr or junior in the name](names/ex15-names-with-jnr-or-junior-in-the-name.json)
 - [ex16 names with generation marking](names/ex16-names-with-generation-marking.json)
 - [ex17 names with initials as part of the name](names/ex17-names-with-initials-as-part-of-the-name.json)



