// ===== DIALOGUE SYSTEM =====
// All interview trees for suspects

import { state, trustModifier, moralityShift, markFactDiscovered, isFactKnown, advanceTime, addTimelineEntry, unlockLocation } from './gamestate.js';

// Returns dialogue tree for a suspect
export function getDialogueTree(suspectId) {
  const trees = { sarah, marcus, dr_hayes, guide_torres, henderson };
  return trees[suspectId] ? trees[suspectId]() : null;
}

function canAsk(factRequired) {
  if (!factRequired) return true;
  return isFactKnown(factRequired);
}

// ---- SARAH KIM ----
function sarah() {
  const s = state.suspects['sarah'];
  const highTrust = s.trust >= 60;
  const veryHighTrust = s.trust >= 80;
  return {
    intro: highTrust
      ? "Sarah looks up with red-rimmed eyes. \"I... I've been thinking. Maybe I should tell you what I know.\""
      : "Sarah sits on the edge of the bed, arms wrapped around herself. \"I already told the teachers everything I know.\"",
    options: [
      {
        text: "When did you last see Emily?",
        response: "\"At dinner... around seven. She seemed distracted. Kept checking her phone. I tried to talk to her but she just said she'd explain later.\"",
        cost: 10,
        onChoose: () => { markFactDiscovered('sarah_dinner'); trustModifier('sarah', 5); },
      },
      {
        text: "You two argued the morning before she disappeared, didn't you?",
        response: highTrust
          ? "Sarah flinches. \"...Yes. We fought. About Hayes. She said she'd found something in the museum — old documents — and that Hayes was dangerous. I told her she was being paranoid. I told her to drop it. That was the last real conversation we had.\""
          : "Sarah's jaw tightens. \"Who told you that? That's... that's private.\"",
        cost: 15,
        requires: 'sarah_dinner',
        onChoose: () => {
          if (highTrust) {
            markFactDiscovered('sarah_fight');
            markFactDiscovered('emily_found_docs');
            trustModifier('sarah', 10);
            addTimelineEntry(undefined, "Sarah confirms: Emily found old documents and believed Hayes was dangerous.");
          } else {
            trustModifier('sarah', -10);
          }
        },
      },
      {
        text: "Did Emily mention meeting anyone that night?",
        response: veryHighTrust
          ? "Sarah whispers: \"She said... she was going to the chapel. That someone was going to meet her there to explain the documents. She wouldn't say who. I should have gone with her. I should have—\" She breaks off, crying."
          : "\"No. Nothing like that. She just said goodnight and went to her room.\"",
        cost: 15,
        requires: 'sarah_fight',
        onChoose: () => {
          if (veryHighTrust) {
            markFactDiscovered('emily_went_chapel');
            unlockLocation('chapel');
            addTimelineEntry(undefined, "BREAKTHROUGH: Emily was heading to the chapel the night she disappeared.");
            trustModifier('sarah', 15);
          }
        },
      },
      {
        text: "Have you noticed anything unusual about Dr. Hayes?",
        response: "\"He's been weird this whole trip. Always whispering on his phone. And he was really interested in what Emily was researching for the history project. Too interested.\"",
        cost: 10,
        onChoose: () => { markFactDiscovered('hayes_suspicious'); trustModifier('sarah', 5); },
      },
      {
        text: "Sarah, I need the thing you're scared to say out loud.",
        response: highTrust
          ? "\"Emily said Hayes wasn't just hiding old history. She said he had a key to the chapel gate and that he panicked when she photographed a page with his grandfather's signature. She made me promise not to tell anyone unless she vanished. Then she vanished.\""
          : "Sarah looks down at her hands. \"I'm not trying to protect anyone. I just... if I say the wrong thing and she's already hurt, then it's my fault twice.\"",
        cost: 15,
        requires: 'hayes_suspicious',
        onChoose: () => {
          if (highTrust) {
            markFactDiscovered('hayes_chapel_key');
            markFactDiscovered('emily_photo_signature');
            state.suspectSuspicion['dr_hayes'] = Math.min(100, (state.suspectSuspicion['dr_hayes'] || 0) + 15);
            unlockLocation('chapel');
            addTimelineEntry(undefined, "Sarah reveals Emily connected Hayes to a chapel key and a signed 1963 document.");
            trustModifier('sarah', 15);
          } else {
            trustModifier('sarah', 8);
            moralityShift(5);
          }
        },
      },
      {
        text: "[ End Interview ]",
        response: null,
        cost: 0,
        isExit: true,
      }
    ]
  };
}

// ---- MARCUS WEBB ----
function marcus() {
  const s = state.suspects['marcus'];
  const highTrust = s.trust >= 55;
  return {
    intro: "Marcus is leaning against the wall outside, arms crossed. He looks up defensively. \"Before you ask — I didn't do anything to her.\"",
    options: [
      {
        text: "Tell me about your relationship with Emily.",
        response: "\"There is no relationship. I mean... I liked her. I gave her a letter. She never replied. I got over it.\" His voice wavers slightly.",
        cost: 10,
        onChoose: () => { markFactDiscovered('marcus_likes_emily'); trustModifier('marcus', 5); },
      },
      {
        text: "Where were you between 8:30 and 10pm?",
        response: highTrust
          ? "A long pause. \"Okay. I went for a walk near the lake. I was trying to clear my head. I saw Emily leave the hotel... I followed her for a bit. Just to talk. But she was walking really fast, like she was going somewhere specific. I called her name but she didn't turn around. So I stopped. I swear I turned back.\""
          : "\"I was by the lake. Alone. I know how that looks.\"",
        cost: 15,
        onChoose: () => {
          if (highTrust) {
            markFactDiscovered('marcus_followed');
            markFactDiscovered('emily_had_destination');
            addTimelineEntry(undefined, "Marcus confirms: Emily left the hotel quickly, heading somewhere with purpose around 9pm.");
            trustModifier('marcus', 10);
          } else {
            trustModifier('marcus', 5);
          }
        },
      },
      {
        text: "Did you see which direction Emily was heading?",
        response: highTrust && isFactKnown('marcus_followed')
          ? "\"East. Toward the treeline. There's a path that leads toward the old chapel... I didn't think much of it then. God, I should have followed.\" His voice breaks."
          : "\"I don't know. I wasn't paying attention.\"",
        cost: 10,
        requires: 'marcus_followed',
        onChoose: () => {
          if (highTrust) {
            markFactDiscovered('emily_direction_east');
            unlockLocation('chapel');
            trustModifier('marcus', 10);
          }
        },
      },
      {
        text: "Your letter was opened. Did Emily answer you?",
        response: Object.values(state.clues).some(c => c.id === 'confession_letter' && c.found)
          ? "\"She wrote one word on the back: 'Sorry.' That was it. I was angry for maybe five minutes, then I saw Hayes near the side stairs and I got embarrassed and left. He had mud on his cuffs before the storm really started.\""
          : "\"What letter? I mean... no. She didn't answer me. Can we not do this?\"",
        cost: 15,
        requires: 'marcus_likes_emily',
        onChoose: () => {
          if (Object.values(state.clues).some(c => c.id === 'confession_letter' && c.found)) {
            markFactDiscovered('hayes_muddy_cuffs');
            state.suspectSuspicion['dr_hayes'] = Math.min(100, (state.suspectSuspicion['dr_hayes'] || 0) + 10);
            trustModifier('marcus', 12);
            addTimelineEntry(undefined, "Marcus saw mud on Hayes' cuffs before the storm intensified.");
          } else {
            trustModifier('marcus', -5);
          }
        },
      },
      {
        text: "You followed her. What made you stop?",
        response: highTrust && isFactKnown('marcus_followed')
          ? "\"She wasn't alone anymore. I saw a flashlight blink twice from the trees. Emily stopped like she recognized the signal. Then someone said her name. An adult voice. Calm. Like a teacher calling roll.\""
          : "\"I told you, I turned back. I didn't want to be that guy.\"",
        cost: 15,
        requires: 'marcus_followed',
        onChoose: () => {
          if (highTrust) {
            markFactDiscovered('adult_voice_signal');
            state.suspectSuspicion['dr_hayes'] = Math.min(100, (state.suspectSuspicion['dr_hayes'] || 0) + 15);
            trustModifier('marcus', 8);
          }
        },
      },
      {
        text: "[ End Interview ]",
        response: null,
        cost: 0,
        isExit: true,
      }
    ]
  };
}

// ---- DR. HAYES ----
function dr_hayes() {
  const s = state.suspects['dr_hayes'];
  const hasDocs = isFactKnown('emily_found_docs') || Object.values(state.clues).some(c => c.id === 'old_documents' && c.found);
  const hasFootprints = Object.values(state.clues).some(c => c.id === 'footprints' && c.found);
  const hasFootage = Object.values(state.clues).some(c => c.id === 'camera_footage' && c.found);
  const highSuspicion = (state.suspectSuspicion['dr_hayes'] || 0) >= 60;

  return {
    intro: highSuspicion
      ? "Hayes shifts uncomfortably as you approach. \"Detective. I've already told you what I know. I hope you're not planning to waste both our time.\""
      : "Dr. Hayes is calm — almost too calm. \"Terrible business. Emily was one of my brightest students. Whatever I can do to help.\"",
    options: [
      {
        text: "Walk me through your evening — minute by minute.",
        response: "\"Dinner ended around seven-thirty. I graded some papers, then around nine I went for a walk. The rain was easing. I returned to the hotel around eleven. Went straight to bed.\"",
        cost: 10,
        onChoose: () => { markFactDiscovered('hayes_alibi'); trustModifier('dr_hayes', -5); },
      },
      {
        text: "Security footage shows you leaving nine minutes after Emily. Explain that.",
        response: hasFootage
          ? "Hayes stiffens — just barely. \"I... went the other direction. Toward the road. I wouldn't have crossed Emily's path at all.\""
          : "\"I'm afraid I don't know what footage you're referring to.\"",
        cost: 15,
        requires: 'hayes_alibi',
        onChoose: () => {
          if (hasFootage) {
            markFactDiscovered('hayes_followed_emily');
            trustModifier('dr_hayes', -15);
            state.suspectSuspicion['dr_hayes'] = Math.min(100, (state.suspectSuspicion['dr_hayes'] || 0) + 20);
            addTimelineEntry(undefined, "Hayes gave a contradicted statement about that evening's footage.");
          }
        },
      },
      {
        text: "Emily found documents about your family in the museum. What were they?",
        response: hasDocs
          ? "A flash of something crosses his face — fear. \"I don't know what you mean. Old county records are a matter of public history.\" His hands are very still now."
          : "\"I'm not aware of any documents connected to my family.\"",
        cost: 20,
        requires: 'emily_found_docs',
        onChoose: () => {
          if (hasDocs) {
            markFactDiscovered('hayes_knows_docs');
            trustModifier('dr_hayes', -20);
            state.suspectSuspicion['dr_hayes'] = Math.min(100, (state.suspectSuspicion['dr_hayes'] || 0) + 25);
            addTimelineEntry(undefined, "Hayes visibly shaken by mention of museum documents. Clear he knows their significance.");
          }
        },
      },
      {
        text: "The footprints at the forest trail lead directly to the chapel. Your shoe size is a match.",
        response: hasFootprints
          ? "\"That's... circumstantial at best, Detective. Half the people on this trip wear size eleven shoes. I'd be careful about making accusations.\""
          : "\"I really think you're reaching, Detective.\"",
        cost: 20,
        requires: 'hayes_alibi',
        onChoose: () => {
          if (hasFootprints) {
            markFactDiscovered('hayes_footprint_match');
            trustModifier('dr_hayes', -25);
            state.suspectSuspicion['dr_hayes'] = Math.min(100, (state.suspectSuspicion['dr_hayes'] || 0) + 30);
          }
        },
      },
      {
        text: "Your phone record shows a call at 8:50. Who were you waiting to hear from?",
        response: Object.values(state.clues).some(c => c.id === 'hayes_phone' && c.found)
          ? "For the first time, Hayes forgets to blink. \"A parent. Routine trip business.\" You let the silence stretch. He adds, too quickly: \"I never answered it.\""
          : "\"My private calls are not relevant to a missing student unless you have a warrant.\"",
        cost: 15,
        requires: 'hayes_alibi',
        onChoose: () => {
          if (Object.values(state.clues).some(c => c.id === 'hayes_phone' && c.found)) {
            markFactDiscovered('hayes_waited_for_call');
            trustModifier('dr_hayes', -15);
            state.suspectSuspicion['dr_hayes'] = Math.min(100, (state.suspectSuspicion['dr_hayes'] || 0) + 20);
            addTimelineEntry(undefined, "Hayes becomes evasive about the 8:50pm phone call to his room.");
          }
        },
      },
      {
        text: "Listen to this recording. Is that your voice threatening Emily?",
        response: Object.values(state.clues).some(c => c.id === 'voice_recording' && c.found)
          ? "The recording crackles: '...it'll ruin everything...' Hayes goes pale. \"Anyone can sound like anyone in rain and static.\" But his eyes flick to the door before the denial finishes."
          : "\"A recording you cannot produce is theater, Detective.\"",
        cost: 20,
        requires: 'hayes_knows_docs',
        onChoose: () => {
          if (Object.values(state.clues).some(c => c.id === 'voice_recording' && c.found)) {
            markFactDiscovered('hayes_voice_match');
            trustModifier('dr_hayes', -25);
            state.suspectSuspicion['dr_hayes'] = Math.min(100, (state.suspectSuspicion['dr_hayes'] || 0) + 30);
            addTimelineEntry(undefined, "Hayes reacts badly to the lake recording of a man threatening Emily over the papers.");
          }
        },
      },
      {
        text: "Enough. Where did you leave Emily?",
        response: highSuspicion
          ? "\"You have no idea what that girl was willing to do.\" His composure cracks, then reforms. \"Search wherever your little board tells you to search. Just remember she wanted a story.\""
          : "\"I won't dignify that with an answer.\"",
        cost: 20,
        requires: 'hayes_voice_match',
        onChoose: () => {
          if (highSuspicion) {
            markFactDiscovered('secret_branch_hint');
            unlockLocation('tunnels');
            trustModifier('dr_hayes', -30);
            addTimelineEntry(undefined, "Hayes implies Emily may have used the tunnels deliberately to expose him.");
          }
        },
      },
      {
        text: "[ End Interview ]",
        response: null,
        cost: 0,
        isExit: true,
      }
    ]
  };
}

// ---- RAMON TORRES ----
function guide_torres() {
  const s = state.suspects['guide_torres'];
  const highTrust = s.trust >= 55;
  return {
    intro: "Ramon looks worried, wringing his cap in his hands. \"I've been thinking about whether I said something... whether I put her in danger.\"",
    options: [
      {
        text: "Tell me about the chapel tunnel you mentioned to Emily.",
        response: "\"During the history walk, I mentioned the old tunnel network. It's a local legend. I didn't think she'd go looking for it alone! If I'd known—\" He's genuinely distressed.",
        cost: 10,
        onChoose: () => {
          markFactDiscovered('torres_told_emily_tunnel');
          markFactDiscovered('tunnels_real');
          unlockLocation('tunnels');
          trustModifier('guide_torres', 10);
          addTimelineEntry(undefined, "Torres confirms: tunnels beneath the chapel are real. Emily knew about them.");
        },
      },
      {
        text: "Is there any way in or out of those tunnels besides the chapel trapdoor?",
        response: highTrust
          ? "\"Yes — there's a ventilation shaft that comes out near the east face of the chapel, and... wait. There's also an old mine entrance about two hundred meters into the forest. Someone could be trapped down there and still be breathing. If the door was sealed from outside—\""
          : "\"I'm not sure. I've never been in myself.\"",
        cost: 15,
        requires: 'tunnels_real',
        onChoose: () => {
          if (highTrust) {
            markFactDiscovered('tunnel_escape_route');
            addTimelineEntry(undefined, "Torres: tunnels have multiple exits. Emily could still be alive inside.");
            trustModifier('guide_torres', 15);
          }
        },
      },
      {
        text: "Who else knew about the tunnels?",
        response: "\"Anyone who read the museum placard... or anyone who's lived here a long time. The old families especially. The Hayeses owned the chapel property once, before the county took it.\"",
        cost: 10,
        onChoose: () => {
          markFactDiscovered('hayes_chapel_connection');
          state.suspectSuspicion['dr_hayes'] = Math.min(100, (state.suspectSuspicion['dr_hayes'] || 0) + 15);
          addTimelineEntry(undefined, "Torres: Hayes family history tied to the chapel property.");
          trustModifier('guide_torres', 5);
        },
      },
      {
        text: "If Emily is underground, where would sound carry?",
        response: highTrust
          ? "\"The old cistern chamber. You can hear water from the lake through the stone there. If she was trapped and banging on pipework, someone near the dock might hear it like a knock under the boards.\""
          : "\"Sound does strange things in those hills. Water, stone, old pipes... I would need to think.\"",
        cost: 15,
        requires: 'tunnels_real',
        onChoose: () => {
          if (highTrust) {
            markFactDiscovered('cistern_carries_sound');
            unlockLocation('lake');
            trustModifier('guide_torres', 10);
            addTimelineEntry(undefined, "Torres points to the tunnel cistern beneath the lake approach.");
          }
        },
      },
      {
        text: "[ End Interview ]",
        response: null,
        cost: 0,
        isExit: true,
      }
    ]
  };
}

// ---- HENDERSON ----
function henderson() {
  const s = state.suspects['henderson'];
  const highTrust = s.trust >= 55;
  const hasLedger = Object.values(state.clues).some(c => c.id === 'hotel_ledger' && c.found);
  return {
    intro: "Henderson is polishing the front desk obsessively, back turned. He speaks without looking at you. \"I've got a hotel to run, Detective.\"",
    options: [
      {
        text: "Did you see Emily yesterday evening?",
        response: "\"Briefly. She crossed the lobby around nine. In a hurry. Didn't stop to talk.\"",
        cost: 10,
        onChoose: () => { markFactDiscovered('henderson_saw_emily'); trustModifier('henderson', 5); },
      },
      {
        text: "Was anyone following her?",
        response: highTrust
          ? "Henderson sets down his cloth slowly. \"I didn't want to get involved. But yes. Mr. Hayes — Dr. Hayes — came through about five minutes later. Moving fast. I called out, asked if he needed something. He didn't answer.\" He finally meets your eyes."
          : "\"I'm not in the business of monitoring guests, Detective.\"",
        cost: 20,
        requires: 'henderson_saw_emily',
        onChoose: () => {
          if (highTrust) {
            markFactDiscovered('henderson_saw_hayes_follow');
            trustModifier('henderson', 15);
            state.suspectSuspicion['dr_hayes'] = Math.min(100, (state.suspectSuspicion['dr_hayes'] || 0) + 25);
            addTimelineEntry(undefined, "EYEWITNESS: Henderson saw Hayes follow Emily through the lobby at 9pm.");
          } else {
            trustModifier('henderson', -10);
          }
        },
      },
      {
        text: "This hotel was built on seized land. The 1963 records.",
        response: hasLedger
          ? "A long silence. \"...The Hayes family brokered that deal. Richard Hayes Senior. His son has known since he was twelve years old. When I saw Emily with those documents... I thought about warning her. I should have.\" His voice drops to a whisper."
          : "\"Where did you hear that? Those are old, closed records.\"",
        cost: 20,
        requires: 'henderson_saw_emily',
        onChoose: () => {
          if (hasLedger) {
            markFactDiscovered('henderson_full_truth');
            markFactDiscovered('hayes_family_crime');
            trustModifier('henderson', 20);
            addTimelineEntry(undefined, "Henderson reveals: Hayes Sr. committed fraud. Hayes Jr. has been covering it up his whole life.");
          }
        },
      },
      {
        text: "You saw Hayes threaten Emily. Tell me the exact words.",
        response: highTrust
          ? "\"He said, 'Children who dig in graves fall into them.' Emily laughed at him, bold as brass, and said she had copies. That was when he grabbed her wrist. I stepped out from the desk and he let go.\""
          : "\"I saw an argument, not a threat. Don't put words in my mouth.\"",
        cost: 20,
        requires: 'henderson_saw_hayes_follow',
        onChoose: () => {
          if (highTrust) {
            markFactDiscovered('hayes_threatened_emily');
            state.suspectSuspicion['dr_hayes'] = Math.min(100, (state.suspectSuspicion['dr_hayes'] || 0) + 25);
            trustModifier('henderson', 10);
            addTimelineEntry(undefined, "Henderson quotes Hayes threatening Emily over the documents.");
          }
        },
      },
      {
        text: "[ End Interview ]",
        response: null,
        cost: 0,
        isExit: true,
      }
    ]
  };
}
