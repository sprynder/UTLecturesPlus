import requests

response = requests.get("https://lecturecapture.la.utexas.edu/caption_proxy?url=https://lectures-engage.la.utexas.edu/static/mh_default_org/engage-player/daae6094-7881-4ade-b41a-fe73ffcce3a9/db594f61-4e18-44e4-8697-e0a16a6c8ca1/laitswhisper_transcript_321522b8-dc4b-4267-91bb-b34f5424bd9e.vtt")
print(response.content)