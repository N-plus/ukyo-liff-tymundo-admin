// src/components/SoccerSchoolAdmin.jsx
import React, { useState, useEffect } from 'react';
import '../App.css';
import { Users, Link, RotateCcw, Search, Plus, X, Trash } from 'lucide-react';
import {
    fetchPlayers,
    fetchLineUsers,
    addPlayer,
    deletePlayer,
    deleteRenkeiPlayer,
    updateLineUserFamily,
    updatePlayerFamily,
    updatePlayerSubCount,
} from '../api';

const SoccerSchoolAdmin = () => {
    // ── State 定義 ─────────────────────────────────
    const [players, setPlayers] = useState([]);
    const [lineUsers, setLineUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('players');
    const [showPlayerForm, setShowPlayerForm] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showSiblingModal, setShowSiblingModal] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [showParentLinkModal, setShowParentLinkModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParent, setSelectedParent] = useState(null);
    const [newPlayerName, setNewPlayerName] = useState('');

    // ── データ読み込み ────────────────────────────────
    useEffect(() => {
        Promise.all([fetchPlayers(), fetchLineUsers()])
            .then(([playersData = [], lineUserData = []]) => {
                setPlayers(Array.isArray(playersData) ? playersData : []);
                setLineUsers(Array.isArray(lineUserData) ? lineUserData : []);
            })
            .catch(console.error);
    }, []);

    // ── ヘルパー関数 ───────────────────────────────
    const updateTransferCount = (playerId, delta) => {
        setPlayers(prev => {
            const next = prev.map(p =>
                p.id === playerId
                    ? { ...p, substitute_count: Math.max(0, p.substitute_count + delta) }
                    : p
            );

            // 計算後の最新値を取得して API へ
            const newCount = next.find(p => p.id === playerId).substitute_count;

            updatePlayerSubCount(playerId, newCount)
                .catch(err => {
                    console.error(err);
                    // 失敗したらロールバックする例
                    setPlayers(prev);   // 元の状態に戻す
                    alert('保存に失敗しました');
                });

            return next; // 楽観的に即描画を更新
        });
    };

    const resetTransferCount = playerId => {
        setPlayers(players.map(p =>
            p.id === playerId
                ? { ...p, substitute_count: 0 }
                : p
        ));
    };

    const getLinkedParents = player =>
        lineUsers.filter(u => u.family_id === player.family_id);

    const getUnlinkedParents = () =>
        lineUsers.filter(u => u.family_id === null);

    const linkParentToPlayer = async (player, parent) => {
        try {
            // API：line_user.family_id = player.family_id
            await updateLineUserFamily(parent.id, player.family_id);
            // state 更新
            setLineUsers(prev =>
                prev.map(u =>
                    u.id === parent.id
                        ? { ...u, family_id: player.family_id }
                        : u
                )
            );
        } catch (err) {
            console.error(err);
            alert('保護者紐づけに失敗しました');
        }
    };

    const unlinkParentFromPlayer = async (player, parent) => {
        try {
            await updateLineUserFamily(parent.id, null);
            setLineUsers(prev =>
                prev.map(u =>
                    u.id === parent.id
                        ? { ...u, family_id: null }
                        : u
                )
            );
        } catch (err) {
            console.error(err);
            alert('保護者の紐づけ解除に失敗しました');
        }
    };

    const getLinkedPlayers = parent =>
        players.filter(p => p.family_id === parent.family_id);

    const getUnlinkedPlayers = parent =>
        players.filter(p => p.family_id !== parent.family_id);

    const linkPlayerToParent = (parent, player) => {
        updatePlayerFamily(player.id, parent.family_id).catch(console.error);
        setPlayers(players.map(p =>
            p.id === player.id
                ? { ...p, family_id: parent.family_id }
                : p
        ));
    };

    const unlinkPlayerFromParent = (parent, player) => {
        updatePlayerFamily(player.id, null).catch(console.error);
        setPlayers(players.map(p =>
            p.id === player.id
                ? { ...p, family_id: null }
                : p
        ));
    };

    const handleSetSibling = async (targetPlayer) => {
        if (!selectedPlayer) return;

        // 1. id を数値として比較
        const id1 = parseInt(selectedPlayer.id, 10);
        const id2 = parseInt(targetPlayer.id, 10);
        const minId = Math.min(id1, id2);
        // 2. ゼロパディングした文字列に戻す
        const minIdStr = String(minId).padStart(5, '0');

        // 3. そのプレイヤーの family_id を参照（なければ新規に作成）
        const ref = players.find(p => p.id === minIdStr);
        const newFamilyId = ref && ref.family_id
            ? ref.family_id
            : 'XA' + minIdStr;

        // 4. 更新対象はこの２人だけ
        const affectedIds = [selectedPlayer.id, targetPlayer.id];

        try {
            // 5. API で一括更新
            await Promise.all(
                affectedIds.map(id => updatePlayerFamily(id, newFamilyId))
            );
            // 6. state に反映
            setPlayers(prev =>
                prev.map(p =>
                    affectedIds.includes(p.id)
                        ? { ...p, family_id: newFamilyId }
                        : p
                )
            );
            setShowSiblingModal(false);
        } catch (err) {
            console.error(err);
            alert('兄弟設定に失敗しました');
        }
    };

    const handleAddPlayer = () => {
        const name = newPlayerName.trim();
        if (!name) return;
        addPlayer(name)
            .then(newP => {
                // バックエンドが返してくれた newP.id, newP.family_id などをそのまま追加
                setPlayers([newP, ...players]);
                setNewPlayerName('');
                setShowPlayerForm(false);
            })
            .catch(err => {
                console.error(err);
                alert('選手追加に失敗しました');
            });
    };

    const handleDeletePlayer = (playerId) => {
        if (window.confirm('本当に削除しますか？')) {
            deletePlayer(playerId).catch(console.error);
            setPlayers(players.filter(p => p.id !== playerId));
        }
    };

    const handleDeleteRenkeiPlayer = async (parentId) => {
        try {
            await deleteRenkeiPlayer(parentId);
            setLineUsers(prev =>
                prev.map(u =>
                    u.id === parentId
                        ? { ...u, family_id: null }
                        : u
                )
            );
        } catch (err) {
            console.error(err);
            alert('紐づけ解除に失敗しました');
        }
    };

    const getSiblings = player =>
        players.filter(p => p.family_id === player.family_id && p.id !== player.id);

    const filteredPlayers = players.filter(p =>
        (p.name || '').includes(searchTerm)
    );
    const filteredLineUsers = lineUsers.filter(u =>
        (u.display_name || '').includes(searchTerm)
    );

    const hasLinkedPlayer = parent =>
        players.some(p => p.family_id === parent.family_id);

    const sortedLineUsers = filteredLineUsers.slice().sort((a, b) => {
        const aHas = hasLinkedPlayer(a);
        const bHas = hasLinkedPlayer(b);
        if (aHas === bHas) return 0;
        return aHas ? 1 : -1;
    });

    const hasLinkedParent = player =>
        lineUsers.some(u => u.family_id === player.family_id);

    const sortedPlayers = filteredPlayers.slice().sort((a, b) => {
        const aHas = hasLinkedParent(a);
        const bHas = hasLinkedParent(b);
        if (aHas === bHas) return 0;
        return aHas ? 1 : -1;
    });

    // ── JSX ────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <div className="gradientBg shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                            <img src="https://tymundofs2018.tokyo/images/icon.JPG" alt="" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">T.Y.MUNDOスクール管理画面</h1>
                    </div>
                    <div className="relative w-full sm:w-auto mt-2 sm:mt-0">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="検索..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* タブ */}
            <div className="max-w-7xl mx-auto px-4 border-b border-gray-200">
                <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
                    {['players', 'parents'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab === 'players'
                                ? '選手管理'
                                : '保護者管理'}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8 space-y-6">
                {/* ── 選手タブ ── */}
                {activeTab === 'players' && (
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
                            <h2 className="text-lg font-semibold">選手一覧</h2>
                            <button
                                onClick={() => setShowPlayerForm(true)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 w-full sm:w-auto"
                            >
                                <Plus className="w-4 h-4" /> <span>選手追加</span>
                            </button>
                        </div>
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">選手名</th>
                                        <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">振替回数</th>
                                        <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">紐づけ済み保護者</th>
                                        <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">兄弟</th>
                                        <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sortedPlayers.map(p => (
                                        <tr key={p.id} className={`${hasLinkedParent(p) ? '' : 'bg-red-50'}`}>
                                            <td className="px-6 py-4">{p.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => updateTransferCount(p.id, -1)}
                                                        disabled={p.substitute_count === 0}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                                                    >-</button>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${p.substitute_count > 0
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {p.substitute_count}
                                                    </span>
                                                    <button onClick={() => updateTransferCount(p.id, 1)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                                                    >+</button>
                                                    <button onClick={() => resetTransferCount(p.id)} title="リセット"
                                                        className="p-1 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 items-center">
                                                    {getLinkedParents(p).length === 0 && (
                                                        <span className="px-2 py-1 text-xs text-red-600">未登録</span>
                                                    )}
                                                    {getLinkedParents(p).map(u => (
                                                        <span key={u.id} className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                                                            {u.display_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 items-center">
                                                    {getSiblings(p).map(s => (
                                                        <span key={s.id} className="px-2 py-1 text-xs bg-blue-100 rounded-full">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => {
                                                    setSelectedPlayer(p);
                                                    setShowLinkModal(true);
                                                }}
                                                    className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                                >
                                                    <Link className="w-4 h-4" /> <span>紐づけ</span>
                                                </button>
                                                <button onClick={() => {
                                                    setSelectedPlayer(p);
                                                    setShowSiblingModal(true);
                                                }}
                                                    className="ml-2 text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                                >
                                                    <Users className="w-4 h-4" /> <span>兄弟設定</span>
                                                </button>
                                                <button onClick={() => handleDeletePlayer(p.id)}
                                                    className="ml-2 text-red-600 hover:text-red-900 flex items-center space-x-1"
                                                >
                                                    <Trash className="w-4 h-4" /> <span>削除</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── 保護者タブ ── */}
                {activeTab === 'parents' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">保護者一覧（LINE登録済み）</h2>
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">プロフィール画像</th>
                                        <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">表示名</th>
                                        <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">LINE ID</th>
                                        <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">登録日</th>
                                        <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">紐づけ済み選手</th>
                                        <th className="px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase">紐づけ解除</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sortedLineUsers.map(u => (
                                        <tr key={u.id} className={`${getLinkedPlayers(u).length === 0 ? 'bg-red-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <img
                                                    src={u.picture_url || './images/default-avatar.png'}    // 空ならデフォルト
                                                    className="w-10 h-10 rounded-full object-cover"
                                                    alt={u.display_name}
                                                    onError={e => {                                     // URL切れにも対応
                                                        e.currentTarget.src = './images/default-avatar.png';
                                                    }}
                                                />
                                            </td>
                                            <td className="px-6 py-4">{u.display_name}</td>
                                            <td className="px-6 py-4">{u.line_user_id}</td>
                                            <td className="px-6 py-4">{u.created_at}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {getLinkedPlayers(u).length === 0 && (
                                                        <span className="px-2 py-1 text-xs text-red-600">未連携</span>
                                                    )}
                                                    {getLinkedPlayers(u).map(p => (
                                                        <span key={p.id} className="px-2 py-1 text-xs bg-blue-100 rounded-full">
                                                            {p.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleDeleteRenkeiPlayer(u.id)}
                                                    className="text-red-600 hover:text-blue-900 flex items-center space-x-1">
                                                    <Trash className="w-4 h-4" /> <span>紐づけ解除</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ── 選手追加フォーム ── */}
            {showPlayerForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-medium mb-4">新しい選手を追加</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">選手名</label>
                                <input
                                    type="text"
                                    value={newPlayerName}
                                    onChange={e => setNewPlayerName(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="選手名を入力"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-6 space-x-3">
                            <button onClick={() => setShowPlayerForm(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                                キャンセル
                            </button>
                            <button onClick={handleAddPlayer}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                追加
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 選手紐づけモーダル ── */}
            {showLinkModal && selectedPlayer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-medium mb-4">
                            「{selectedPlayer.name}」の保護者を選択
                        </h3>
                        <div className="space-y-6">
                            {/* 紐づけ可能な保護者 */}
                            <div>
                                <h4 className="font-medium mb-2">紐づけ可能な保護者</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {getUnlinkedParents().map(u => (
                                        <div key={u.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                            <span>{u.display_name}</span>
                                            <button
                                                onClick={() => linkParentToPlayer(selectedPlayer, u)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 紐づけ済みの保護者 */}
                            <div>
                                <h4 className="font-medium mb-2">紐づけ済みの保護者</h4>
                                <div className="space-y-2">
                                    {getLinkedParents(selectedPlayer).map(u => (
                                        <div key={u.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                                            <span>{u.display_name}</span>
                                            <button
                                                onClick={() => unlinkParentFromPlayer(selectedPlayer, u)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowLinkModal(false)}
                            className="mt-6 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}

            {showSiblingModal && selectedPlayer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-medium mb-4">
                            「{selectedPlayer.name}」の兄弟を設定
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {players
                                .filter(p => p.id !== selectedPlayer.id)
                                .map(pl => (
                                    <div key={pl.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                        <span>{pl.name}</span>
                                        <button
                                            onClick={() => handleSetSibling(pl)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            }
                        </div>
                        <button
                            onClick={() => setShowSiblingModal(false)}
                            className="mt-6 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SoccerSchoolAdmin;
